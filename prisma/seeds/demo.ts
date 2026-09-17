import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");
if (process.env.DEMO_MODE !== "true") throw new Error("Demo seed requires DEMO_MODE=true.");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seed() {
  const existing = await db.property.findUnique({ where: { slug: "katerina-studios" } });
  if (existing && !existing.isDemo) throw new Error("The seed cannot change a verified property.");
  await db.$transaction(async (tx) => {
    const property = await tx.property.upsert({
      where: { slug: "katerina-studios" },
      update: { portalPlan: "FULL_CONTROL" },
      create: {
        id: "10000000-0000-4000-8000-000000000001",
        slug: "katerina-studios",
        name: "Katerina Studios — demonstration data",
        isDemo: true,
        bookingEnabled: false,
        ownerNotificationEmail: "owner@example.test",
        portalPlan: "FULL_CONTROL",
        minimumStay: 1,
        maximumStay: 30,
        bookingHorizonDays: 365,
      },
    });
    for (const unit of [
      {
        id: "20000000-0000-4000-8000-000000000001",
        slug: "demo-studio-a",
        name: "Demo Studio A",
        basePriceCents: 6000,
        sortOrder: 1,
      },
      {
        id: "20000000-0000-4000-8000-000000000002",
        slug: "demo-studio-b",
        name: "Demo Studio B",
        basePriceCents: 7000,
        sortOrder: 2,
      },
    ]) {
      await tx.accommodation.upsert({
        where: { slug: unit.slug },
        update: {},
        create: { ...unit, propertyId: property.id, maxGuests: 2, isDemo: true },
      });
    }
    await tx.policyVersion.upsert({
      where: { propertyId_version: { propertyId: property.id, version: 1 } },
      update: {},
      create: {
        id: "30000000-0000-4000-8000-000000000001",
        propertyId: property.id,
        version: 1,
        isDemo: true,
        summary:
          "Demo policy. This request is not confirmed. The owner must confirm it. Pay the quoted total in cash on arrival. Contact the property to cancel. Real prices, charges and terms require owner review.",
      },
    });
  });
  console.info(
    "Two demo studios and a demo policy are ready. No real property facts were verified.",
  );
}

seed()
  .finally(() => db.$disconnect())
  .catch(() => {
    console.error("Demo seed failed. Check the database and demo settings.");
    process.exitCode = 1;
  });
