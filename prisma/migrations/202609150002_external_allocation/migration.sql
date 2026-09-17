ALTER TABLE "InventoryAllocation" DROP CONSTRAINT "allocation_dates_and_kind";
ALTER TABLE "InventoryAllocation" ADD CONSTRAINT "allocation_dates_and_kind"
  CHECK ("endDate" > "startDate"
    AND (("kind" = 'RESERVATION' AND "reservationId" IS NOT NULL)
      OR ("kind" IN ('MANUAL_BLOCK', 'EXTERNAL') AND "reservationId" IS NULL))
    AND (("active" AND "releasedAt" IS NULL) OR (NOT "active" AND "releasedAt" IS NOT NULL)));
