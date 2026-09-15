import { getEnv, readinessIssues } from "../config/env";
import { prisma } from "../infrastructure/db/client";
import { processOutbox } from "../infrastructure/email/outbox";
import { ResendEmailProvider } from "../infrastructure/email/provider";

let stopped = false;
process.on("SIGTERM", () => {
  stopped = true;
});
process.on("SIGINT", () => {
  stopped = true;
});
async function main() {
  const env = getEnv();
  if (readinessIssues(env).length) throw new Error("Worker configuration is incomplete");
  const provider = new ResendEmailProvider({
    demo: env.DEMO_MODE,
    key: env.RESEND_API_KEY,
    from: env.EMAIL_FROM ?? "Demo <demo@example.invalid>",
  });
  while (!stopped) {
    try {
      await processOutbox(provider);
      const now = new Date();
      await prisma.workerHeartbeat.upsert({
        where: { name: "email" },
        create: { name: "email", lastRunAt: now, lastSuccessAt: now },
        update: { lastRunAt: now, lastSuccessAt: now, lastError: null },
      });
      await prisma.authSession.deleteMany({ where: { expiresAt: { lt: now } } });
      await prisma.rateLimitCounter.deleteMany({ where: { expiresAt: { lt: now } } });
      const failures = await prisma.emailOutbox.count({
        where: { status: { in: ["FAILED", "UNCERTAIN"] } },
      });
      const backlog = await prisma.emailOutbox.count({
        where: { status: "QUEUED", createdAt: { lt: new Date(now.getTime() - 300000) } },
      });
      if (failures || backlog)
        console.warn(JSON.stringify({ event: "EMAIL_ATTENTION_REQUIRED", failures, backlog }));
    } catch {
      console.error(JSON.stringify({ event: "EMAIL_WORKER_ERROR" }));
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
main()
  .catch(() => {
    console.error(JSON.stringify({ event: "WORKER_STOPPED" }));
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
