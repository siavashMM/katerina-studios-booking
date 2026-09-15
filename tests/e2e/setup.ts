import { execFileSync } from "node:child_process";
import { prisma } from "../../src/infrastructure/db/client";
export default async function setup() {
  if (!process.env.DATABASE_URL || !new URL(process.env.DATABASE_URL).pathname.endsWith("_test"))
    throw new Error("Unsafe test database");
  await prisma.$executeRawUnsafe(
    'TRUNCATE "Property", "Accommodation", "PolicyVersion", "Reservation", "SeasonalPrice", "InventoryAllocation", "EmailOutbox", "AuditEvent", "OwnerMembership", "AuthSession", "RateLimitCounter", "ProcessedWebhook" CASCADE',
  );
  execFileSync(process.execPath, ["--import", "tsx", "prisma/seeds/demo.ts"], {
    env: process.env,
    stdio: "pipe",
  });
  await prisma.$disconnect();
}
