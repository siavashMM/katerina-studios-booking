import { randomUUID } from "node:crypto";
import { Prisma, type EmailOutbox } from "@prisma/client";
import { prisma } from "@/infrastructure/db/client";
import { renderEmail } from "@/emails/reservation";
import { DeliveryError, type EmailProvider } from "./provider";

export async function processOutbox(provider: EmailProvider, options: { ids?: string[] } = {}) {
  if (options.ids?.length === 0) return 0;
  const worker = randomUUID();
  const jobs = await prisma.$queryRaw<EmailOutbox[]>(Prisma.sql`
    UPDATE "EmailOutbox" SET status = 'PROCESSING', "lockedAt" = NOW(), "lockedBy" = ${worker}, attempts = attempts + 1, "firstAttemptAt" = COALESCE("firstAttemptAt", NOW())
    WHERE id IN (SELECT id FROM "EmailOutbox" WHERE ((status = 'QUEUED' AND "nextAttemptAt" <= NOW()) OR (status = 'PROCESSING' AND "lockedAt" < NOW() - INTERVAL '2 minutes'))
    ${options.ids ? Prisma.sql`AND id IN (${Prisma.join(options.ids)})` : Prisma.empty}
    ORDER BY "createdAt" LIMIT 5 FOR UPDATE SKIP LOCKED) RETURNING *`);
  for (const job of jobs) {
    const where = { id: job.id, lockedBy: worker, status: "PROCESSING" as const };
    const release = { lockedAt: null, lockedBy: null };
    if (job.firstAttemptAt && Date.now() - job.firstAttemptAt.getTime() >= 23 * 3600000) {
      await prisma.emailOutbox.updateMany({
        where,
        data: { ...release, status: "UNCERTAIN", lastError: "PROVIDER_WINDOW_EXPIRED" },
      });
      continue;
    }
    try {
      if (job.reservationId && job.kind.startsWith("GUEST_")) {
        const reservation = await prisma.reservation.findUniqueOrThrow({
          where: { id: job.reservationId },
        });
        if (
          (job.kind === "GUEST_REQUESTED" && reservation.status !== "PENDING") ||
          (job.kind === "GUEST_CONFIRMED" && reservation.status === "CANCELLED")
        ) {
          await prisma.emailOutbox.updateMany({
            where,
            data: { ...release, status: "SKIPPED", lastError: "SUPERSEDED" },
          });
          continue;
        }
      }
      const message = renderEmail(job.kind, job.payload);
      const result = await provider.send({
        ...message,
        to: job.recipient,
        idempotencyKey: job.idempotencyKey,
      });
      // Reconcile an early delivery failure before releasing the claim.
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${result.id}, 1))`;
        const failed = await tx.processedWebhook.findFirst({
          where: {
            provider: "resend",
            providerId: result.id,
            eventType: { in: ["email.bounced", "email.complained", "email.failed"] },
          },
        });
        await tx.emailOutbox.updateMany({
          where,
          data: {
            ...release,
            status: result.captured ? "SKIPPED" : failed ? "FAILED" : "SENT",
            providerId: result.id,
            sentAt: new Date(),
            lastError: result.captured ? "DEMO_CAPTURED" : failed ? "DELIVERY_FAILED" : null,
          },
        });
      });
    } catch (error) {
      const permanent = error instanceof DeliveryError && error.permanent;
      await prisma.emailOutbox.updateMany({
        where,
        data: {
          ...release,
          status: permanent ? "FAILED" : job.attempts >= 8 ? "UNCERTAIN" : "QUEUED",
          lastError: error instanceof DeliveryError ? error.code : "DELIVERY_ERROR",
          nextAttemptAt: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** job.attempts)),
        },
      });
    }
  }
  return jobs.length;
}
