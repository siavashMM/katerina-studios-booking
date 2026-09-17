import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createBookingService } from "../../src/features/booking/application/booking-service";
import { createAdminService } from "../../src/features/admin/application/admin-service";

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = databaseUrl ? describe : describe.skip;
suite("PostgreSQL booking transactions", () => {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl ?? "postgresql://unused" }),
  });
  const now = () => new Date("2027-04-01T08:00:00Z");
  const booking = createBookingService(db, {
    now,
    receiptSecret: "integration-receipt-secret-with-32-characters",
    demoMode: true,
  });
  const admin = createAdminService(db, { now });
  let accommodationId: string;
  let actor: { id: string; propertyId: string };
  const stay = { checkIn: "2027-06-01", checkOut: "2027-06-04", guests: 2 };
  beforeAll(async () => {
    await db.$connect();
  });
  afterAll(async () => {
    await db.$disconnect();
  });
  beforeEach(async () => {
    await db.$executeRawUnsafe(
      'TRUNCATE "Property", "Accommodation", "PolicyVersion", "Reservation", "SeasonalPrice", "InventoryAllocation", "EmailOutbox", "AuditEvent", "OwnerMembership" CASCADE',
    );
    const property = await db.property.create({
      data: {
        slug: "katerina-studios",
        name: "Demo property",
        isDemo: true,
        portalPlan: "FULL_CONTROL",
        ownerNotificationEmail: "owner@example.test",
      },
    });
    const accommodation = await db.accommodation.create({
      data: {
        propertyId: property.id,
        slug: "demo-studio-a",
        name: "Demo studio A",
        maxGuests: 2,
        basePriceCents: 6000,
      },
    });
    accommodationId = accommodation.id;
    await db.policyVersion.create({
      data: { propertyId: property.id, version: 1, summary: "Demo policy. Cash on arrival." },
    });
    const owner = await db.ownerMembership.create({
      data: {
        propertyId: property.id,
        issuer: "https://example.test/",
        authSubject: "owner",
        email: "owner@example.test",
      },
    });
    actor = { id: owner.id, propertyId: property.id };
  });
  async function request(key = randomUUID()) {
    const quote = await booking.getQuote({ accommodationId, ...stay });
    const input = {
      idempotencyKey: key,
      quoteFingerprint: quote.fingerprint,
      accommodationId,
      ...stay,
      guest: { firstName: "Test", lastName: "Guest", email: "guest@example.test" },
      policyAccepted: true as const,
    };
    return { input, result: await booking.createRequest(input) };
  }
  it("persists one pending request and two email jobs without holding inventory", async () => {
    const { result } = await request();
    expect(result.receipt.status).toBe("PENDING");
    expect(await db.inventoryAllocation.count()).toBe(0);
    expect(await db.emailOutbox.count()).toBe(2);
    expect((await booking.getAvailability(stay)).quotes).toHaveLength(1);
    expect(
      (await booking.getReceipt(result.receipt.reference, result.receiptToken)).reference,
    ).toBe(result.receipt.reference);
    await expect(booking.getReceipt(result.receipt.reference, "wrong-token")).rejects.toMatchObject(
      { code: "NOT_FOUND" },
    );
  });
  it("creates one manual external reservation and blocks its dates", async () => {
    const idempotencyKey = randomUUID();
    const input = {
      idempotencyKey,
      accommodationId,
      checkIn: stay.checkIn,
      checkOut: stay.checkOut,
      guests: 2,
      source: "BOOKING_COM" as const,
      firstName: "Manual",
      lastName: "Guest",
      email: "manual@example.test",
      country: "DE",
      preferredLanguage: "de",
      internalNotes: "Entered from the Booking.com owner record.",
    };

    const first = await admin.createManualReservation(actor, input);
    const replay = await admin.createManualReservation(actor, input);

    expect(replay.id).toBe(first.id);
    expect(first).toMatchObject({ source: "BOOKING_COM", status: "CONFIRMED" });
    expect(await db.reservation.count()).toBe(1);
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(1);
    expect((await booking.getAvailability(stay)).quotes).toHaveLength(0);
  });
  it("imports one iCal event once and blocks availability", async () => {
    const calendar = await admin.createExternalCalendar(actor, {
      accommodationId,
      name: "External calendar",
      encryptedUrl: "encrypted-test-value",
    });
    const event = {
      externalId: "external-42",
      start: stay.checkIn,
      end: stay.checkOut,
      summary: "Imported reservation",
      cancelled: false,
    };

    await admin.syncExternalCalendar(actor, calendar.id, [event]);
    await admin.syncExternalCalendar(actor, calendar.id, [event]);

    expect(await db.externalCalendarEvent.count()).toBe(1);
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(1);
    expect((await booking.getAvailability(stay)).quotes).toHaveLength(0);
  });
  it("updates and archives accommodation content without deleting history", async () => {
    const updated = await admin.updateAccommodation(actor, accommodationId, {
      name: "Garden Studio",
      shortDescription: "A compact studio near the garden.",
      fullDescription: "A calm studio with a private outdoor area.",
      maxGuests: 2,
      beds: "One double bed",
      amenities: ["Air conditioning", "Kitchenette"],
      active: false,
    });

    expect(updated).toMatchObject({ name: "Garden Studio", active: false });
    expect(await db.accommodation.count({ where: { id: accommodationId } })).toBe(1);
    expect(await db.auditEvent.count({ where: { action: "ACCOMMODATION_UPDATED" } })).toBe(1);
  });
  it("manages public content, photos, messages, and calendar projections", async () => {
    const portal = await admin.getPortalContext(actor);
    expect(portal.property.portalPlan).toBe("FULL_CONTROL");
    expect(portal.capabilities.canManagePhotos).toBe(true);
    expect(await admin.getPropertyContent(actor)).toBeNull();

    const content = {
      introduction: "A direct family welcome.",
      story: "A factual property story.",
      contactEmail: "stay@example.test",
      contactPhone: "+30 123 456 7890",
      locationSummary: "A hillside location in Paleokastritsa.",
      checkIn: "15:00",
      checkOut: "11:00",
      arrivalInstructions: "Call on arrival.",
      amenities: ["Kitchenette"],
      policies: ["Cash on arrival"],
    };
    expect((await admin.updatePropertyContent(actor, content)).introduction).toBe(
      content.introduction,
    );
    expect((await admin.getPropertyContent(actor))?.policies).toEqual(content.policies);
    expect(await admin.listAccommodationContent(actor)).toHaveLength(1);
    expect(await admin.listAccommodationsForOwner(actor)).toHaveLength(1);

    const firstKey = `${randomUUID()}.webp`;
    const first = await admin.createMediaAsset(actor, {
      storageKey: firstKey,
      publicUrl: `/owner-uploads/${firstKey}`,
      altText: "The property entrance",
      width: 1600,
      height: 1200,
    });
    const secondKey = `${randomUUID()}.webp`;
    const second = await admin.createMediaAsset(actor, {
      storageKey: secondKey,
      publicUrl: `/owner-uploads/${secondKey}`,
      altText: "A studio balcony",
      width: 1200,
      height: 1600,
      accommodationId,
    });
    await admin.updateMediaAsset(actor, first.id, {
      altText: "The main property entrance",
      isHero: true,
      sortOrder: 2,
    });
    await admin.updateMediaAsset(actor, second.id, {
      altText: "A private studio balcony",
      isHero: true,
      sortOrder: 1,
    });
    const media = await admin.listMedia(actor);
    expect(media).toHaveLength(2);
    expect(media.find((item) => item.id === first.id)?.isHero).toBe(false);
    expect((await admin.deleteMediaAsset(actor, first.id)).id).toBe(first.id);

    const { result } = await request();
    const reservation = await db.reservation.findUniqueOrThrow({
      where: { reference: result.receipt.reference },
    });
    const messageKey = randomUUID();
    const message = await admin.sendGuestMessage(actor, reservation.id, {
      idempotencyKey: messageKey,
      subject: "Arrival details",
      message: "Please tell us your arrival time.",
    });
    expect(
      (
        await admin.sendGuestMessage(actor, reservation.id, {
          idempotencyKey: messageKey,
          subject: "Arrival details",
          message: "Please tell us your arrival time.",
        })
      ).id,
    ).toBe(message.id);

    const calendar = await admin.listCalendar(actor, {
      start: "2027-05-25",
      end: "2027-06-15",
    });
    expect(calendar.reservations).toHaveLength(1);
    expect(calendar.accommodations).toHaveLength(1);
    expect(calendar.blocks).toHaveLength(0);
    await expect(
      admin.listCalendar(actor, { start: "2027-01-01", end: "2027-04-01" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
  it("updates, cancels, removes, lists, and disconnects iCal events", async () => {
    const calendar = await admin.createExternalCalendar(actor, {
      accommodationId,
      name: "Availability feed",
      encryptedUrl: "encrypted-test-value",
    });
    expect(await admin.listExternalCalendars(actor)).toHaveLength(1);
    const original = {
      externalId: "moving-event",
      start: "2027-07-01",
      end: "2027-07-03",
      summary: "Original dates",
      cancelled: false,
    };
    await admin.syncExternalCalendar(actor, calendar.id, [original]);
    await admin.syncExternalCalendar(actor, calendar.id, [
      { ...original, start: "2027-07-04", end: "2027-07-07", summary: "Moved dates" },
    ]);
    expect(
      await db.inventoryAllocation.count({
        where: { active: true, startDate: new Date("2027-07-04") },
      }),
    ).toBe(1);
    await admin.syncExternalCalendar(actor, calendar.id, [{ ...original, cancelled: true }]);
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(0);

    await admin.syncExternalCalendar(actor, calendar.id, [
      {
        externalId: "removed-event",
        start: "2027-08-01",
        end: "2027-08-03",
        cancelled: false,
      },
    ]);
    await admin.syncExternalCalendar(actor, calendar.id, []);
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(0);
    expect((await admin.disconnectExternalCalendar(actor, calendar.id)).id).toBe(calendar.id);
    expect(await admin.listExternalCalendars(actor)).toHaveLength(0);
    await expect(admin.syncExternalCalendar(actor, calendar.id, [])).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
  it("enforces Owner Control capability boundaries", async () => {
    await db.property.update({
      where: { id: actor.propertyId },
      data: { portalPlan: "OWNER_CONTROL" },
    });
    const portal = await admin.getPortalContext(actor);
    expect(portal.capabilities).toMatchObject({
      canManageReservations: true,
      canManageCalendar: true,
      canSendGuestMessages: true,
      canManageWebsiteContent: false,
      canManagePricing: false,
      canManagePhotos: false,
      canConfigureChannels: false,
    });
    expect(await admin.listReservations(actor)).toEqual([]);
    expect(
      (await admin.listCalendar(actor, { start: "2027-06-01", end: "2027-06-08" })).reservations,
    ).toEqual([]);
    await expect(admin.getPropertyContent(actor)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.listMedia(actor)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.listRates(actor)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(admin.listExternalCalendars(actor)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("updates the property minimum stay through the pricing capability", async () => {
    expect(await admin.getPricingPolicy(actor)).toMatchObject({ minimumStay: 1, maximumStay: 30 });
    expect((await admin.updatePricingPolicy(actor, { minimumStay: 3 })).minimumStay).toBe(3);
    expect(
      (await db.property.findUniqueOrThrow({ where: { id: actor.propertyId } })).minimumStay,
    ).toBe(3);
    await expect(admin.updatePricingPolicy(actor, { minimumStay: 31 })).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
  it("serializes concurrent retries and rejects a changed payload", async () => {
    const { input } = await request();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => booking.createRequest(input)),
    );
    expect(new Set(results.map((result) => result.receipt.reference)).size).toBe(1);
    expect(await db.reservation.count()).toBe(1);
    expect(await db.emailOutbox.count()).toBe(2);
    await expect(
      booking.createRequest({ ...input, guest: { ...input.guest, firstName: "Other" } }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("rejects changed prices but returns old request on a retry", async () => {
    const { input, result } = await request();
    await admin.updateRates(actor, { accommodationId, basePriceCents: 8000, seasons: [] });
    await expect(
      booking.createRequest({ ...input, idempotencyKey: randomUUID() }),
    ).rejects.toMatchObject({ code: "QUOTE_CHANGED" });
    expect((await booking.createRequest(input)).receipt.totalCents).toBe(result.receipt.totalCents);
  });
  it("confirms exactly one of two competing requests", async () => {
    const a = await request();
    const b = await request();
    const rows = await db.reservation.findMany({ orderBy: { createdAt: "asc" } });
    const results = await Promise.allSettled(
      rows.map((row) => admin.confirmReservation(actor, row.id, { externalChannelsChecked: true })),
    );
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(1);
    expect((await booking.getAvailability(stay)).quotes).toHaveLength(0);
    expect((await booking.createRequest(a.input)).replayed).toBe(true);
    expect((await booking.createRequest(b.input)).replayed).toBe(true);
  });
  it("requires channel check, releases a cancellation, and sends each event once", async () => {
    await request();
    const row = await db.reservation.findFirstOrThrow();
    await expect(
      admin.confirmReservation(actor, row.id, { externalChannelsChecked: false }),
    ).rejects.toMatchObject({ code: "EXTERNAL_CHANNELS_REQUIRED" });
    await admin.confirmReservation(actor, row.id, { externalChannelsChecked: true });
    await admin.confirmReservation(actor, row.id, { externalChannelsChecked: true });
    await admin.cancelReservation(actor, row.id);
    await admin.cancelReservation(actor, row.id);
    expect(await db.emailOutbox.count()).toBe(4);
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(0);
    expect((await booking.getAvailability(stay)).quotes).toHaveLength(1);
    await expect(admin.completeReservation(actor, row.id)).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
  });
  it("enforces manual blocks and half-open turnover dates", async () => {
    const block = await admin.createBlock(actor, {
      accommodationId,
      checkIn: "2027-06-04",
      checkOut: "2027-06-06",
      reason: "Maintenance",
    });
    expect((await booking.getAvailability(stay)).quotes).toHaveLength(1);
    expect(
      (await booking.getAvailability({ ...stay, checkOut: "2027-06-05" })).quotes,
    ).toHaveLength(0);
    await expect(
      admin.createBlock(actor, {
        accommodationId,
        checkIn: "2027-06-05",
        checkOut: "2027-06-07",
        reason: "Second",
      }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await admin.releaseBlock(actor, block.id);
    expect(
      (await booking.getAvailability({ ...stay, checkOut: "2027-06-05" })).quotes,
    ).toHaveLength(1);
  });
  it("rejects unauthorized service access and overlapping seasonal prices", async () => {
    await expect(admin.listReservations({ ...actor, id: randomUUID() })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      admin.updateRates(actor, {
        accommodationId,
        basePriceCents: 6000,
        seasons: [
          { startDate: "2027-06-01", endDate: "2027-07-01", priceCents: 7000, label: "A" },
          { startDate: "2027-06-30", endDate: "2027-08-01", priceCents: 8000, label: "B" },
        ],
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await db.seasonalPrice.create({
      data: {
        accommodationId,
        startDate: new Date("2027-06-01"),
        endDate: new Date("2027-07-01"),
        priceCents: 7000,
        label: "A",
      },
    });
    await expect(
      db.seasonalPrice.create({
        data: {
          accommodationId,
          startDate: new Date("2027-06-30"),
          endDate: new Date("2027-08-01"),
          priceCents: 8000,
          label: "B",
        },
      }),
    ).rejects.toThrow();
  });
  it("enforces allocation overlap and policy immutability in PostgreSQL", async () => {
    const data = {
      accommodationId,
      startDate: new Date("2027-08-01"),
      endDate: new Date("2027-08-04"),
      kind: "MANUAL_BLOCK" as const,
      reason: "Constraint test",
      createdBy: actor.id,
    };
    const results = await Promise.allSettled([
      db.inventoryAllocation.create({ data }),
      db.inventoryAllocation.create({ data }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    await expect(
      db.policyVersion.updateMany({ data: { summary: "Changed text" } }),
    ).rejects.toThrow();
    await db.inventoryAllocation.create({
      data: { ...data, startDate: new Date("2027-08-04"), endDate: new Date("2027-08-05") },
    });
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(2);
  });
  it("lists and searches owner records without exposing other properties", async () => {
    const { result } = await request();
    expect(await booking.listAccommodations()).toHaveLength(1);
    const rows = await admin.listReservations(actor, {
      search: result.receipt.reference,
      status: "PENDING",
    });
    expect(rows).toHaveLength(1);
    expect((await admin.getReservation(actor, rows[0].id)).emails).toHaveLength(2);
    expect(await admin.listReservations(actor, { search: "absent" })).toHaveLength(0);
    expect(await admin.listRates(actor)).toHaveLength(1);
    await expect(admin.getReservation(actor, randomUUID())).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(admin.cancelReservation(actor, randomUUID())).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(admin.releaseBlock(actor, randomUUID())).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      booking.getQuote({ accommodationId: randomUUID(), ...stay }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("allows only one allocation when a block races with confirmation", async () => {
    await request();
    const row = await db.reservation.findFirstOrThrow();
    const results = await Promise.allSettled([
      admin.confirmReservation(actor, row.id, { externalChannelsChecked: true }),
      admin.createBlock(actor, {
        accommodationId,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        reason: "Owner stay",
      }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.inventoryAllocation.count({ where: { active: true } })).toBe(1);
  });
  it("completes only after check-out and keeps completion idempotent", async () => {
    await request();
    const row = await db.reservation.findFirstOrThrow();
    await admin.confirmReservation(actor, row.id, { externalChannelsChecked: true });
    await expect(admin.completeReservation(actor, row.id)).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });
    const later = createAdminService(db, { now: () => new Date("2027-06-05T12:00:00Z") });
    await later.completeReservation(actor, row.id);
    await later.completeReservation(actor, row.id);
    expect((await db.reservation.findUniqueOrThrow({ where: { id: row.id } })).status).toBe(
      "COMPLETED",
    );
    expect(await db.auditEvent.count({ where: { action: "RESERVATION_COMPLETED" } })).toBe(1);
  });
  it("replays blocks and saves seasonal rates with fixed request prices", async () => {
    const data = {
      accommodationId,
      checkIn: "2027-07-01",
      checkOut: "2027-07-03",
      reason: "Repairs",
    };
    const block = await admin.createBlock(actor, data);
    expect((await admin.createBlock(actor, data)).id).toBe(block.id);
    expect(await admin.listBlocks(actor)).toHaveLength(1);
    await admin.releaseBlock(actor, block.id);
    await admin.releaseBlock(actor, block.id);
    expect(await admin.listBlocks(actor)).toHaveLength(0);
    await admin.updateRates(actor, {
      accommodationId,
      basePriceCents: 6000,
      seasons: [
        { startDate: "2027-06-01", endDate: "2027-06-03", priceCents: 8000, label: "Summer" },
      ],
    });
    expect((await booking.getQuote({ accommodationId, ...stay })).totalCents).toBe(22000);
    await expect(
      admin.createBlock(actor, { ...data, checkOut: "2031-07-01" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
  it("rolls back a request when owner notification has no recipient", async () => {
    await db.property.update({
      where: { id: actor.propertyId },
      data: { ownerNotificationEmail: null },
    });
    await expect(request()).rejects.toMatchObject({ code: "BOOKING_DISABLED" });
    expect(await db.reservation.count()).toBe(0);
    expect(await db.emailOutbox.count()).toBe(0);
  });
  it("rejects unverified inventory, missing policies, and stale receipts", async () => {
    const { result } = await request();
    const later = createBookingService(db, {
      now: () => new Date("2027-04-01T10:00:00Z"),
      receiptSecret: "integration-receipt-secret-with-32-characters",
      demoMode: true,
    });
    await expect(
      later.getReceipt(result.receipt.reference, result.receiptToken),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(booking.getReceipt("bad", "token")).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(booking.getReceipt(`KS-${"A".repeat(20)}`, "token")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const live = createBookingService(db, {
      now,
      receiptSecret: "integration-receipt-secret-with-32-characters",
      demoMode: false,
    });
    await expect(live.getAvailability(stay)).rejects.toMatchObject({ code: "BOOKING_DISABLED" });
    await db.policyVersion.updateMany({ data: { active: false } });
    await expect(booking.getAvailability(stay)).rejects.toMatchObject({ code: "BOOKING_DISABLED" });
    const absent = createBookingService(db, {
      now,
      receiptSecret: "integration-receipt-secret-with-32-characters",
      propertySlug: "absent",
    });
    await expect(absent.getAvailability(stay)).rejects.toMatchObject({ code: "BOOKING_DISABLED" });
  });
});
