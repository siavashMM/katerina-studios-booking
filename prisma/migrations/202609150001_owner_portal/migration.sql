CREATE TYPE "ReservationSource" AS ENUM ('DIRECT', 'MANUAL', 'BOOKING_COM', 'AIRBNB', 'ICAL', 'PHONE', 'EMAIL', 'OTHER');
CREATE TYPE "PortalPlan" AS ENUM ('OWNER_CONTROL', 'FULL_CONTROL');
ALTER TYPE "AllocationKind" ADD VALUE 'EXTERNAL';

ALTER TABLE "Property" ADD COLUMN "portalPlan" "PortalPlan" NOT NULL DEFAULT 'OWNER_CONTROL';
ALTER TABLE "Reservation"
  ADD COLUMN "preferredLanguage" TEXT,
  ADD COLUMN "internalNotes" TEXT,
  ADD COLUMN "source" "ReservationSource" NOT NULL DEFAULT 'DIRECT',
  ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'CASH_ON_ARRIVAL',
  ADD COLUMN "priceIsKnown" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "ExternalCalendar" (
  "id" UUID NOT NULL,
  "propertyId" UUID NOT NULL,
  "accommodationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "encryptedUrl" TEXT NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "lastSyncedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalCalendar_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ExternalCalendar_propertyId_active_idx" ON "ExternalCalendar"("propertyId", "active");

CREATE TABLE "ExternalCalendarEvent" (
  "id" UUID NOT NULL,
  "externalCalendarId" UUID NOT NULL,
  "allocationId" UUID NOT NULL,
  "externalId" TEXT NOT NULL,
  "source" "ReservationSource" NOT NULL DEFAULT 'ICAL',
  "summary" TEXT,
  "lastSeenAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalCalendarEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalCalendarEvent_allocationId_key" ON "ExternalCalendarEvent"("allocationId");
CREATE UNIQUE INDEX "ExternalCalendarEvent_externalCalendarId_externalId_key" ON "ExternalCalendarEvent"("externalCalendarId", "externalId");

CREATE TABLE "PropertyContent" (
  "id" UUID NOT NULL,
  "propertyId" UUID NOT NULL,
  "introduction" TEXT NOT NULL DEFAULT '',
  "story" TEXT NOT NULL DEFAULT '',
  "contactEmail" TEXT NOT NULL DEFAULT '',
  "contactPhone" TEXT NOT NULL DEFAULT '',
  "locationSummary" TEXT NOT NULL DEFAULT '',
  "checkIn" TEXT NOT NULL DEFAULT '',
  "checkOut" TEXT NOT NULL DEFAULT '',
  "arrivalInstructions" TEXT NOT NULL DEFAULT '',
  "amenities" JSONB NOT NULL DEFAULT '[]',
  "policies" JSONB NOT NULL DEFAULT '[]',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PropertyContent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PropertyContent_propertyId_key" ON "PropertyContent"("propertyId");

CREATE TABLE "MediaAsset" (
  "id" UUID NOT NULL,
  "propertyId" UUID NOT NULL,
  "accommodationId" UUID,
  "storageKey" TEXT NOT NULL,
  "publicUrl" TEXT NOT NULL,
  "altText" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isHero" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE INDEX "MediaAsset_propertyId_sortOrder_idx" ON "MediaAsset"("propertyId", "sortOrder");

ALTER TABLE "ExternalCalendar" ADD CONSTRAINT "ExternalCalendar_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendar" ADD CONSTRAINT "ExternalCalendar_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendarEvent" ADD CONSTRAINT "ExternalCalendarEvent_externalCalendarId_fkey" FOREIGN KEY ("externalCalendarId") REFERENCES "ExternalCalendar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendarEvent" ADD CONSTRAINT "ExternalCalendarEvent_allocationId_fkey" FOREIGN KEY ("allocationId") REFERENCES "InventoryAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PropertyContent" ADD CONSTRAINT "PropertyContent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_accommodationId_fkey" FOREIGN KEY ("accommodationId") REFERENCES "Accommodation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
