import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { prisma } from "@/infrastructure/db/client";

export async function recordDeliveryEvent(eventId: string, eventType: string, providerId?: string) {
  try {
    await prisma.$transaction(async (tx) => {
      if (providerId)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${providerId}, 1))`;
      await tx.processedWebhook.create({
        data: { id: randomUUID(), provider: "resend", eventId, eventType, providerId },
      });
      if (providerId && ["email.bounced", "email.complained", "email.failed"].includes(eventType)) {
        await tx.emailOutbox.updateMany({
          where: { providerId },
          data: { status: "FAILED", lastError: eventType.toUpperCase().replaceAll(".", "_") },
        });
      }
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"))
      throw error;
  }
}
