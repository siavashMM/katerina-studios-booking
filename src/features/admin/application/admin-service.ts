import { randomBytes } from "node:crypto";
import {
  type PrismaClient,
  type Prisma,
  type ReservationStatus,
  type ReservationSource,
} from "@prisma/client";
import { z } from "zod";
import {
  calculatePrice,
  dateOnly,
  dateRange,
  DomainError,
  parseDate,
  todayInAthens,
  transition,
} from "../../booking/domain/rules";
import {
  enqueueReservationEmail,
  ensureAvailable,
  hash,
  lockAccommodation,
  mapDatabaseError,
  validate,
  type Transaction,
} from "../../booking/application/booking-service";
import { manualReservationSchema } from "../contracts/reservations";
import {
  capabilitiesFor,
  requireCapability,
  type PortalCapabilities,
  type PortalPlan,
} from "../domain/capabilities";
import type { CalendarChannelEvent } from "@/infrastructure/calendar/provider";

export type AdminActor = { id: string; propertyId: string };
const actorSchema = z.object({ id: z.uuid(), propertyId: z.uuid() });
const identifier = z.uuid();
const blockSchema = z
  .object({
    accommodationId: z.uuid(),
    checkIn: z.string(),
    checkOut: z.string(),
    reason: z.string().trim().min(1).max(300),
  })
  .strict();
const ratesSchema = z
  .object({
    accommodationId: z.uuid(),
    basePriceCents: z.number().int().min(0).max(2_147_483_647),
    seasons: z
      .array(
        z
          .object({
            startDate: z.string(),
            endDate: z.string(),
            priceCents: z.number().int().min(0).max(2_147_483_647),
            label: z.string().trim().min(1).max(80),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
const pricingPolicySchema = z.object({ minimumStay: z.number().int().min(1).max(365) }).strict();
const messageSchema = z
  .object({
    idempotencyKey: z.uuid(),
    subject: z.string().trim().min(1).max(160),
    message: z.string().trim().min(1).max(5000),
  })
  .strict();
const contentSchema = z
  .object({
    introduction: z.string().trim().max(4000),
    story: z.string().trim().max(8000),
    contactEmail: z.union([z.literal(""), z.email().max(254)]),
    contactPhone: z.string().trim().max(40),
    locationSummary: z.string().trim().max(3000),
    checkIn: z.string().trim().max(80),
    checkOut: z.string().trim().max(80),
    arrivalInstructions: z.string().trim().max(5000),
    amenities: z.array(z.string().trim().min(1).max(100)).max(100),
    policies: z.array(z.string().trim().min(1).max(500)).max(50),
  })
  .strict();
const mediaSchema = z
  .object({
    storageKey: z.string().regex(/^[0-9a-f-]{36}\.webp$/),
    publicUrl: z.string().regex(/^\/owner-uploads\/[0-9a-f-]{36}\.webp$/),
    altText: z.string().trim().min(1).max(300),
    width: z.number().int().positive().max(20_000),
    height: z.number().int().positive().max(20_000),
    accommodationId: z.uuid().optional(),
  })
  .strict();
const externalCalendarSchema = z
  .object({
    accommodationId: z.uuid(),
    name: z.string().trim().min(1).max(100),
    encryptedUrl: z.string().min(1).max(4000),
  })
  .strict();
const accommodationSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    shortDescription: z.string().trim().max(600),
    fullDescription: z.string().trim().max(6000),
    maxGuests: z.number().int().min(1).max(20),
    beds: z.string().trim().max(200),
    amenities: z.array(z.string().trim().min(1).max(100)).max(100),
    active: z.boolean(),
  })
  .strict();
const calendarEventsSchema = z
  .array(
    z
      .object({
        externalId: z.string().min(1).max(500),
        start: z.string(),
        end: z.string(),
        summary: z.string().max(300).optional(),
        cancelled: z.boolean(),
      })
      .strict(),
  )
  .max(5000);

export function createAdminService(
  db: PrismaClient,
  options: { now?: () => Date; appUrl?: string } = {},
) {
  const now = options.now ?? (() => new Date());
  async function authorize(
    client: PrismaClient | Transaction,
    raw: AdminActor,
    capability?: keyof PortalCapabilities,
  ): Promise<AdminActor & { plan: PortalPlan }> {
    const actor = validate(actorSchema, raw);
    const membership = await client.ownerMembership.findFirst({
      where: { id: actor.id, propertyId: actor.propertyId, active: true },
      select: { id: true, property: { select: { portalPlan: true } } },
    });
    if (!membership) throw new DomainError("FORBIDDEN", "You do not have access to this property.");
    const plan = membership.property.portalPlan as PortalPlan;
    if (capability) requireCapability(plan, capability);
    return { ...actor, plan };
  }

  async function getPortalContext(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor);
    const property = await db.property.findUniqueOrThrow({
      where: { id: actor.propertyId },
      select: { id: true, name: true, portalPlan: true, isDemo: true },
    });
    return { property, capabilities: capabilitiesFor(actor.plan) };
  }
  async function audit(
    tx: Transaction,
    actor: AdminActor,
    action: string,
    metadata: Prisma.InputJsonObject,
    reservationId?: string,
  ) {
    await tx.auditEvent.create({
      data: {
        propertyId: actor.propertyId,
        actorId: actor.id,
        action,
        metadata,
        reservationId,
        createdAt: now(),
      },
    });
  }
  async function listReservations(
    rawActor: AdminActor,
    raw: { status?: ReservationStatus; search?: string } = {},
  ) {
    const actor = await authorize(db, rawActor, "canManageReservations");
    const input = validate(
      z
        .object({
          status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
          search: z.string().trim().max(100).optional(),
        })
        .strict(),
      raw,
    );
    return db.reservation.findMany({
      where: {
        propertyId: actor.propertyId,
        status: input.status,
        ...(input.search
          ? {
              OR: [
                { reference: { contains: input.search, mode: "insensitive" } },
                { firstName: { contains: input.search, mode: "insensitive" } },
                { lastName: { contains: input.search, mode: "insensitive" } },
                { email: { contains: input.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { accommodation: { select: { name: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 200,
    });
  }
  async function listAccommodationsForOwner(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canManageReservations");
    return db.accommodation.findMany({
      where: { propertyId: actor.propertyId, active: true },
      select: { id: true, name: true, maxGuests: true },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  }
  async function getReservation(rawActor: AdminActor, rawId: string) {
    const actor = await authorize(db, rawActor, "canManageReservations");
    const id = validate(identifier, rawId);
    const row = await db.reservation.findFirst({
      where: { id, propertyId: actor.propertyId },
      include: {
        accommodation: { select: { name: true, isDemo: true } },
        emails: {
          select: {
            id: true,
            kind: true,
            status: true,
            attempts: true,
            lastError: true,
            sentAt: true,
            createdAt: true,
            recipient: true,
            payload: true,
            providerId: true,
          },
        },
        audits: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!row) throw new DomainError("NOT_FOUND", "The reservation was not found.");
    return row;
  }

  async function listCalendar(rawActor: AdminActor, raw: unknown) {
    const input = validate(z.object({ start: z.string(), end: z.string() }).strict(), raw);
    const range = dateRange(input.start, input.end);
    if (range.nights > 62)
      throw new DomainError("VALIDATION_ERROR", "The calendar period is too long.");
    const actor = await authorize(db, rawActor, "canManageCalendar");
    const [reservations, blocks, accommodations] = await Promise.all([
      db.reservation.findMany({
        where: {
          propertyId: actor.propertyId,
          status: { in: ["PENDING", "CONFIRMED", "COMPLETED"] },
          checkIn: { lt: parseDate(input.end) },
          checkOut: { gt: parseDate(input.start) },
        },
        select: {
          id: true,
          reference: true,
          firstName: true,
          lastName: true,
          checkIn: true,
          checkOut: true,
          guests: true,
          status: true,
          source: true,
          accommodationId: true,
        },
        orderBy: [{ checkIn: "asc" }, { id: "asc" }],
      }),
      db.inventoryAllocation.findMany({
        where: {
          active: true,
          kind: { in: ["MANUAL_BLOCK", "EXTERNAL"] },
          accommodation: { propertyId: actor.propertyId },
          startDate: { lt: parseDate(input.end) },
          endDate: { gt: parseDate(input.start) },
        },
        select: {
          id: true,
          accommodationId: true,
          startDate: true,
          endDate: true,
          kind: true,
          reason: true,
          externalEvent: { select: { source: true, summary: true } },
        },
        orderBy: [{ startDate: "asc" }, { id: "asc" }],
      }),
      db.accommodation.findMany({
        where: { propertyId: actor.propertyId, active: true },
        select: { id: true, name: true },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      }),
    ]);
    return { reservations, blocks, accommodations };
  }

  async function sendGuestMessage(rawActor: AdminActor, rawId: string, raw: unknown) {
    const id = validate(identifier, rawId);
    const input = validate(messageSchema, raw);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canSendGuestMessages");
      const reservation = await tx.reservation.findFirst({
        where: { id, propertyId: actor.propertyId },
        include: { accommodation: { select: { name: true } } },
      });
      if (!reservation) throw new DomainError("NOT_FOUND", "The reservation was not found.");
      const idempotencyKey = `${reservation.id}:OWNER_MESSAGE:${input.idempotencyKey}`;
      const previous = await tx.emailOutbox.findUnique({ where: { idempotencyKey } });
      if (previous) return previous;
      const email = await tx.emailOutbox.create({
        data: {
          reservationId: reservation.id,
          kind: "OWNER_MESSAGE",
          recipient: reservation.email,
          idempotencyKey,
          payload: {
            reference: reservation.reference,
            guestName: `${reservation.firstName} ${reservation.lastName}`,
            guestEmail: reservation.email,
            accommodationName: reservation.accommodation.name,
            checkIn: dateOnly(reservation.checkIn),
            checkOut: dateOnly(reservation.checkOut),
            guestCount: reservation.guests,
            nights: reservation.nights,
            totalCents: reservation.totalCents,
            currency: reservation.currency,
            policySummary: "",
            messageSubject: input.subject,
            messageBody: input.message,
          },
        },
      });
      await audit(
        tx,
        actor,
        "GUEST_MESSAGE_QUEUED",
        { emailId: email.id, subject: input.subject },
        reservation.id,
      );
      return email;
    });
  }

  async function getPropertyContent(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canManageWebsiteContent");
    return db.propertyContent.findUnique({ where: { propertyId: actor.propertyId } });
  }

  async function updatePropertyContent(rawActor: AdminActor, raw: unknown) {
    const input = validate(contentSchema, raw);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManageWebsiteContent");
      const content = await tx.propertyContent.upsert({
        where: { propertyId: actor.propertyId },
        create: { propertyId: actor.propertyId, ...input },
        update: input,
      });
      await audit(tx, actor, "PROPERTY_CONTENT_UPDATED", { fields: Object.keys(input) });
      return content;
    });
  }

  async function listAccommodationContent(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canManageWebsiteContent");
    return db.accommodation.findMany({
      where: { propertyId: actor.propertyId },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  }

  async function updateAccommodation(rawActor: AdminActor, rawId: string, raw: unknown) {
    const id = validate(identifier, rawId);
    const input = validate(accommodationSchema, raw);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManageWebsiteContent");
      await lockAccommodation(tx, id, actor.propertyId);
      const maximumBookedGuests = await tx.reservation.aggregate({
        where: { accommodationId: id },
        _max: { guests: true },
      });
      if ((maximumBookedGuests._max.guests ?? 0) > input.maxGuests)
        throw new DomainError(
          "VALIDATION_ERROR",
          "The capacity cannot be lower than a historical reservation.",
        );
      const accommodation = await tx.accommodation.update({ where: { id }, data: input });
      await audit(tx, actor, "ACCOMMODATION_UPDATED", {
        accommodationId: id,
        active: input.active,
      });
      return accommodation;
    });
  }

  async function listMedia(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canManagePhotos");
    return db.mediaAsset.findMany({
      where: { propertyId: actor.propertyId },
      include: { accommodation: { select: { name: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async function createMediaAsset(rawActor: AdminActor, raw: unknown) {
    const input = validate(mediaSchema, raw);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManagePhotos");
      if (input.accommodationId) {
        const accommodation = await tx.accommodation.findFirst({
          where: { id: input.accommodationId, propertyId: actor.propertyId },
          select: { id: true },
        });
        if (!accommodation) throw new DomainError("NOT_FOUND", "The studio was not found.");
      }
      const last = await tx.mediaAsset.aggregate({
        where: { propertyId: actor.propertyId },
        _max: { sortOrder: true },
      });
      const media = await tx.mediaAsset.create({
        data: {
          propertyId: actor.propertyId,
          ...input,
          sortOrder: (last._max.sortOrder ?? -1) + 1,
        },
      });
      await audit(tx, actor, "PHOTO_ADDED", { mediaId: media.id });
      return media;
    });
  }

  async function updateMediaAsset(rawActor: AdminActor, rawId: string, raw: unknown) {
    const id = validate(identifier, rawId);
    const input = validate(
      z
        .object({
          altText: z.string().trim().min(1).max(300),
          isHero: z.boolean(),
          sortOrder: z.number().int().min(0).max(10000),
        })
        .strict(),
      raw,
    );
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManagePhotos");
      const current = await tx.mediaAsset.findFirst({
        where: { id, propertyId: actor.propertyId },
      });
      if (!current) throw new DomainError("NOT_FOUND", "The photo was not found.");
      if (input.isHero)
        await tx.mediaAsset.updateMany({
          where: { propertyId: actor.propertyId, isHero: true },
          data: { isHero: false },
        });
      const media = await tx.mediaAsset.update({ where: { id }, data: input });
      await audit(tx, actor, "PHOTO_UPDATED", { mediaId: id });
      return media;
    });
  }

  async function deleteMediaAsset(rawActor: AdminActor, rawId: string) {
    const id = validate(identifier, rawId);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManagePhotos");
      const current = await tx.mediaAsset.findFirst({
        where: { id, propertyId: actor.propertyId },
      });
      if (!current) throw new DomainError("NOT_FOUND", "The photo was not found.");
      await tx.mediaAsset.delete({ where: { id } });
      await audit(tx, actor, "PHOTO_DELETED", { mediaId: id });
      return current;
    });
  }

  async function listExternalCalendars(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canConfigureChannels");
    return db.externalCalendar.findMany({
      where: { propertyId: actor.propertyId, active: true },
      select: {
        id: true,
        name: true,
        lastSyncedAt: true,
        lastError: true,
        accommodation: { select: { name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async function createExternalCalendar(rawActor: AdminActor, raw: unknown) {
    const input = validate(externalCalendarSchema, raw);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canConfigureChannels");
      const accommodation = await tx.accommodation.findFirst({
        where: { id: input.accommodationId, propertyId: actor.propertyId },
        select: { id: true },
      });
      if (!accommodation) throw new DomainError("NOT_FOUND", "The studio was not found.");
      const calendar = await tx.externalCalendar.create({
        data: { propertyId: actor.propertyId, ...input },
      });
      await audit(tx, actor, "ICAL_CALENDAR_CONNECTED", {
        calendarId: calendar.id,
        accommodationId: input.accommodationId,
      });
      return calendar;
    });
  }

  async function syncExternalCalendar(
    rawActor: AdminActor,
    rawId: string,
    rawEvents: CalendarChannelEvent[],
  ) {
    const id = validate(identifier, rawId);
    const events = validate(calendarEventsSchema, rawEvents);
    try {
      return await db.$transaction(
        async (tx) => {
          const actor = await authorize(tx, rawActor, "canConfigureChannels");
          const calendar = await tx.externalCalendar.findFirst({
            where: { id, propertyId: actor.propertyId, active: true },
            include: { events: { include: { allocation: true } } },
          });
          if (!calendar) throw new DomainError("NOT_FOUND", "The iCal calendar was not found.");
          await lockAccommodation(tx, calendar.accommodationId, actor.propertyId);
          const current = new Map(calendar.events.map((event) => [event.externalId, event]));
          const seen = new Set<string>();
          for (const event of events) {
            seen.add(event.externalId);
            const existing = current.get(event.externalId);
            if (event.cancelled) {
              if (existing) {
                await tx.inventoryAllocation.updateMany({
                  where: { id: existing.allocationId, active: true },
                  data: { active: false, releasedAt: now() },
                });
                await tx.externalCalendarEvent.update({
                  where: { id: existing.id },
                  data: { lastSeenAt: now(), summary: event.summary },
                });
              }
              continue;
            }
            dateRange(event.start, event.end);
            if (
              existing &&
              dateOnly(existing.allocation.startDate) === event.start &&
              dateOnly(existing.allocation.endDate) === event.end &&
              existing.allocation.active
            ) {
              await tx.externalCalendarEvent.update({
                where: { id: existing.id },
                data: { lastSeenAt: now(), summary: event.summary },
              });
              continue;
            }
            if (existing)
              await tx.inventoryAllocation.update({
                where: { id: existing.allocationId },
                data: { active: false, releasedAt: now() },
              });
            await ensureAvailable(tx, calendar.accommodationId, event.start, event.end);
            if (existing) {
              await tx.inventoryAllocation.update({
                where: { id: existing.allocationId },
                data: {
                  startDate: parseDate(event.start),
                  endDate: parseDate(event.end),
                  active: true,
                  releasedAt: null,
                  reason: event.summary ?? "External calendar",
                },
              });
              await tx.externalCalendarEvent.update({
                where: { id: existing.id },
                data: { summary: event.summary, lastSeenAt: now() },
              });
            } else {
              const allocation = await tx.inventoryAllocation.create({
                data: {
                  accommodationId: calendar.accommodationId,
                  startDate: parseDate(event.start),
                  endDate: parseDate(event.end),
                  kind: "EXTERNAL",
                  reason: event.summary ?? "External calendar",
                  createdBy: actor.id,
                  createdAt: now(),
                },
              });
              await tx.externalCalendarEvent.create({
                data: {
                  externalCalendarId: calendar.id,
                  allocationId: allocation.id,
                  externalId: event.externalId,
                  source: "ICAL",
                  summary: event.summary,
                  lastSeenAt: now(),
                },
              });
            }
          }
          const missing = calendar.events
            .filter((event) => !seen.has(event.externalId))
            .map((event) => event.allocationId);
          if (missing.length)
            await tx.inventoryAllocation.updateMany({
              where: { id: { in: missing }, active: true },
              data: { active: false, releasedAt: now() },
            });
          await tx.externalCalendar.update({
            where: { id },
            data: { lastSyncedAt: now(), lastError: null },
          });
          await audit(tx, actor, "ICAL_CALENDAR_SYNCED", {
            calendarId: id,
            eventCount: events.length,
          });
          return { eventCount: events.length };
        },
        { timeout: 20_000, maxWait: 5_000 },
      );
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function disconnectExternalCalendar(rawActor: AdminActor, rawId: string) {
    const id = validate(identifier, rawId);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canConfigureChannels");
      const calendar = await tx.externalCalendar.findFirst({
        where: { id, propertyId: actor.propertyId },
        include: { events: true },
      });
      if (!calendar) throw new DomainError("NOT_FOUND", "The iCal calendar was not found.");
      await lockAccommodation(tx, calendar.accommodationId, actor.propertyId);
      await tx.inventoryAllocation.updateMany({
        where: { id: { in: calendar.events.map((event) => event.allocationId) }, active: true },
        data: { active: false, releasedAt: now() },
      });
      await tx.externalCalendar.update({ where: { id }, data: { active: false } });
      await audit(tx, actor, "ICAL_CALENDAR_DISCONNECTED", { calendarId: id });
      return { id };
    });
  }

  async function changeStatus(
    rawActor: AdminActor,
    rawId: string,
    next: ReservationStatus,
    externalChannelsChecked = false,
  ) {
    const id = validate(identifier, rawId);
    try {
      return await db.$transaction(
        async (tx) => {
          const actor = await authorize(tx, rawActor, "canManageReservations");
          const initial = await tx.reservation.findFirst({
            where: { id, propertyId: actor.propertyId },
            select: { accommodationId: true },
          });
          if (!initial) throw new DomainError("NOT_FOUND", "The reservation was not found.");
          // Every inventory mutation locks the studio before the reservation.
          await lockAccommodation(tx, initial.accommodationId, actor.propertyId);
          await tx.$queryRaw`SELECT "id" FROM "Reservation" WHERE "id" = ${id}::uuid FOR UPDATE`;
          const reservation = await tx.reservation.findUniqueOrThrow({
            where: { id },
            include: { accommodation: { select: { name: true, isDemo: true, active: true } } },
          });
          transition(
            reservation.status,
            next,
            dateOnly(reservation.checkOut),
            todayInAthens(now()),
          );
          if (reservation.status === next) return reservation;
          if (next === "CONFIRMED") {
            if (!externalChannelsChecked)
              throw new DomainError(
                "EXTERNAL_CHANNELS_REQUIRED",
                "Check all external booking channels before confirmation.",
              );
            if (
              !reservation.accommodation.active ||
              dateOnly(reservation.checkOut) <= todayInAthens(now())
            )
              throw new DomainError(
                "INVALID_TRANSITION",
                "This reservation can no longer be confirmed.",
              );
            await ensureAvailable(
              tx,
              reservation.accommodationId,
              dateOnly(reservation.checkIn),
              dateOnly(reservation.checkOut),
            );
            await tx.inventoryAllocation.create({
              data: {
                accommodationId: reservation.accommodationId,
                reservationId: reservation.id,
                startDate: reservation.checkIn,
                endDate: reservation.checkOut,
                kind: "RESERVATION",
                createdBy: actor.id,
                createdAt: now(),
              },
            });
          } else {
            await tx.inventoryAllocation.updateMany({
              where: { reservationId: id, active: true },
              data: { active: false, releasedAt: now() },
            });
          }
          const updated = await tx.reservation.update({
            where: { id },
            data: {
              status: next,
              version: { increment: 1 },
              ...(next === "CONFIRMED"
                ? {
                    confirmedAt: now(),
                    externalChannelsCheckedAt: now(),
                    externalChannelsCheckedBy: actor.id,
                  }
                : {}),
              ...(next === "CANCELLED" ? { cancelledAt: now() } : {}),
              ...(next === "COMPLETED" ? { completedAt: now() } : {}),
            },
            include: { accommodation: { select: { name: true, isDemo: true } } },
          });
          if (next === "CONFIRMED" || next === "CANCELLED")
            await enqueueReservationEmail(
              tx,
              updated,
              `GUEST_${next}`,
              updated.email,
              options.appUrl,
            );
          await audit(
            tx,
            actor,
            `RESERVATION_${next}`,
            {
              from: reservation.status,
              to: next,
              version: updated.version,
              ...(next === "CONFIRMED" ? { externalChannelsChecked: true } : {}),
            },
            id,
          );
          return updated;
        },
        { timeout: 10000, maxWait: 5000 },
      );
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function confirmReservation(
    actor: AdminActor,
    id: string,
    raw: { externalChannelsChecked: boolean },
  ) {
    const input = validate(z.object({ externalChannelsChecked: z.boolean() }).strict(), raw);
    return changeStatus(actor, id, "CONFIRMED", input.externalChannelsChecked);
  }
  const cancelReservation = (actor: AdminActor, id: string) => changeStatus(actor, id, "CANCELLED");
  const completeReservation = (actor: AdminActor, id: string) =>
    changeStatus(actor, id, "COMPLETED");

  async function createManualReservation(rawActor: AdminActor, raw: unknown) {
    const input = validate(manualReservationSchema, raw);
    const range = dateRange(input.checkIn, input.checkOut);
    const payloadHash = hash(JSON.stringify(input));
    try {
      return await db.$transaction(
        async (tx) => {
          const actor = await authorize(tx, rawActor, "canManageReservations");
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.idempotencyKey}, 0))`;
          const previous = await tx.reservation.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
          });
          if (previous) {
            if (previous.payloadHash !== payloadHash)
              throw new DomainError(
                "IDEMPOTENCY_CONFLICT",
                "This request key was already used with different details.",
              );
            return previous;
          }
          await lockAccommodation(tx, input.accommodationId, actor.propertyId);
          const accommodation = await tx.accommodation.findFirst({
            where: {
              id: input.accommodationId,
              propertyId: actor.propertyId,
              active: true,
              maxGuests: { gte: input.guests },
            },
          });
          if (!accommodation) throw new DomainError("NOT_FOUND", "The studio was not found.");
          await ensureAvailable(tx, input.accommodationId, input.checkIn, input.checkOut);
          const policy = await tx.policyVersion.findFirst({
            where: { propertyId: actor.propertyId, active: true },
            orderBy: { version: "desc" },
          });
          if (!policy)
            throw new DomainError("VALIDATION_ERROR", "An active booking policy is required.");
          const totalCents = input.totalCents ?? 0;
          const priceSnapshot = {
            manual: true,
            priceIsKnown: input.totalCents !== undefined,
            totalCents,
            subtotalCents: totalCents,
            currency: "EUR",
            policy: { id: policy.id, version: policy.version, summary: policy.summary },
          };
          const reservation = await tx.reservation.create({
            data: {
              propertyId: actor.propertyId,
              accommodationId: input.accommodationId,
              policyVersionId: policy.id,
              reference: `KS-${randomBytes(10).toString("hex").toUpperCase()}`,
              idempotencyKey: input.idempotencyKey,
              payloadHash,
              receiptTokenHash: hash(randomBytes(32).toString("hex")),
              checkIn: parseDate(input.checkIn),
              checkOut: parseDate(input.checkOut),
              guests: input.guests,
              nights: range.nights,
              firstName: input.firstName,
              lastName: input.lastName,
              email: input.email,
              phone: input.phone,
              country: input.country,
              preferredLanguage: input.preferredLanguage,
              internalNotes: input.internalNotes,
              source: input.source as ReservationSource,
              subtotalCents: totalCents,
              totalCents,
              priceIsKnown: input.totalCents !== undefined,
              priceSnapshot,
              policySnapshot: { id: policy.id, version: policy.version, summary: policy.summary },
              quoteFingerprint: hash(JSON.stringify(priceSnapshot)),
              policyAcceptedAt: now(),
              status: "CONFIRMED",
              confirmedAt: now(),
              externalChannelsCheckedAt: now(),
              externalChannelsCheckedBy: actor.id,
              createdAt: now(),
            },
            include: { accommodation: { select: { name: true, isDemo: true } } },
          });
          await tx.inventoryAllocation.create({
            data: {
              accommodationId: reservation.accommodationId,
              reservationId: reservation.id,
              startDate: reservation.checkIn,
              endDate: reservation.checkOut,
              kind: "RESERVATION",
              createdBy: actor.id,
              createdAt: now(),
            },
          });
          if (input.sendConfirmation)
            await enqueueReservationEmail(
              tx,
              reservation,
              "GUEST_CONFIRMED",
              reservation.email,
              options.appUrl,
            );
          await audit(
            tx,
            actor,
            "MANUAL_RESERVATION_CREATED",
            { source: input.source, idempotencyKey: input.idempotencyKey },
            reservation.id,
          );
          return reservation;
        },
        { timeout: 10000, maxWait: 5000 },
      );
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function listBlocks(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canManageCalendar");
    return db.inventoryAllocation.findMany({
      where: {
        kind: "MANUAL_BLOCK",
        active: true,
        accommodation: { propertyId: actor.propertyId },
      },
      include: { accommodation: { select: { name: true } } },
      orderBy: [{ startDate: "asc" }, { id: "asc" }],
    });
  }
  async function createBlock(rawActor: AdminActor, raw: unknown) {
    const input = validate(blockSchema, raw);
    const range = dateRange(input.checkIn, input.checkOut);
    if (range.nights > 1095)
      throw new DomainError("VALIDATION_ERROR", "The block period is too long.");
    try {
      return await db.$transaction(async (tx) => {
        const actor = await authorize(tx, rawActor, "canManageCalendar");
        await lockAccommodation(tx, input.accommodationId, actor.propertyId);
        const existing = await tx.inventoryAllocation.findFirst({
          where: {
            accommodationId: input.accommodationId,
            kind: "MANUAL_BLOCK",
            active: true,
            startDate: parseDate(input.checkIn),
            endDate: parseDate(input.checkOut),
            reason: input.reason,
          },
        });
        if (existing) return existing;
        await ensureAvailable(tx, input.accommodationId, input.checkIn, input.checkOut);
        const block = await tx.inventoryAllocation.create({
          data: {
            accommodationId: input.accommodationId,
            startDate: parseDate(input.checkIn),
            endDate: parseDate(input.checkOut),
            kind: "MANUAL_BLOCK",
            reason: input.reason,
            createdBy: actor.id,
            createdAt: now(),
          },
        });
        await audit(tx, actor, "MANUAL_BLOCK_CREATED", {
          blockId: block.id,
          accommodationId: input.accommodationId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
        });
        return block;
      });
    } catch (error) {
      return mapDatabaseError(error);
    }
  }
  async function releaseBlock(rawActor: AdminActor, rawId: string) {
    const id = validate(identifier, rawId);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManageCalendar");
      const block = await tx.inventoryAllocation.findFirst({
        where: { id, kind: "MANUAL_BLOCK", accommodation: { propertyId: actor.propertyId } },
      });
      if (!block) throw new DomainError("NOT_FOUND", "The block was not found.");
      await lockAccommodation(tx, block.accommodationId, actor.propertyId);
      const updated = await tx.inventoryAllocation.updateMany({
        where: { id, active: true },
        data: { active: false, releasedAt: now() },
      });
      if (updated.count) await audit(tx, actor, "MANUAL_BLOCK_RELEASED", { blockId: id });
      return { id, released: true };
    });
  }
  async function listRates(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canManagePricing");
    return db.accommodation.findMany({
      where: { propertyId: actor.propertyId },
      include: { seasonalPrices: { orderBy: { startDate: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  }
  async function getPricingPolicy(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor, "canManagePricing");
    return db.property.findUniqueOrThrow({
      where: { id: actor.propertyId },
      select: { minimumStay: true, maximumStay: true },
    });
  }
  async function updatePricingPolicy(rawActor: AdminActor, raw: unknown) {
    const input = validate(pricingPolicySchema, raw);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManagePricing");
      const current = await tx.property.findUniqueOrThrow({
        where: { id: actor.propertyId },
        select: { minimumStay: true, maximumStay: true },
      });
      if (input.minimumStay > current.maximumStay)
        throw new DomainError(
          "VALIDATION_ERROR",
          "The minimum stay cannot be longer than the maximum stay.",
        );
      const property = await tx.property.update({
        where: { id: actor.propertyId },
        data: { minimumStay: input.minimumStay },
        select: { minimumStay: true, maximumStay: true },
      });
      await audit(tx, actor, "MINIMUM_STAY_UPDATED", {
        previous: current.minimumStay,
        minimumStay: input.minimumStay,
      });
      return property;
    });
  }
  async function updateRates(rawActor: AdminActor, raw: unknown) {
    const input = validate(ratesSchema, raw);
    calculatePrice(dateRange("2027-01-01", "2027-01-02"), input.basePriceCents, input.seasons);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor, "canManagePricing");
      await lockAccommodation(tx, input.accommodationId, actor.propertyId);
      const previous = await tx.accommodation.findUniqueOrThrow({
        where: { id: input.accommodationId },
        include: { seasonalPrices: true },
      });
      await tx.accommodation.update({
        where: { id: input.accommodationId },
        data: { basePriceCents: input.basePriceCents },
      });
      await tx.seasonalPrice.deleteMany({ where: { accommodationId: input.accommodationId } });
      if (input.seasons.length)
        await tx.seasonalPrice.createMany({
          data: input.seasons.map((season) => ({
            accommodationId: input.accommodationId,
            label: season.label,
            priceCents: season.priceCents,
            startDate: parseDate(season.startDate),
            endDate: parseDate(season.endDate),
          })),
        });
      await audit(tx, actor, "RATES_UPDATED", {
        accommodationId: input.accommodationId,
        previous: {
          basePriceCents: previous.basePriceCents,
          seasons: previous.seasonalPrices.map((season) => ({
            startDate: dateOnly(season.startDate),
            endDate: dateOnly(season.endDate),
            priceCents: season.priceCents,
            label: season.label,
          })),
        },
        basePriceCents: input.basePriceCents,
        seasons: input.seasons,
      });
      return tx.accommodation.findUniqueOrThrow({
        where: { id: input.accommodationId },
        include: { seasonalPrices: { orderBy: { startDate: "asc" } } },
      });
    });
  }
  return {
    getPortalContext,
    listReservations,
    listAccommodationsForOwner,
    getReservation,
    listCalendar,
    sendGuestMessage,
    getPropertyContent,
    updatePropertyContent,
    listAccommodationContent,
    updateAccommodation,
    listMedia,
    createMediaAsset,
    updateMediaAsset,
    deleteMediaAsset,
    listExternalCalendars,
    createExternalCalendar,
    syncExternalCalendar,
    disconnectExternalCalendar,
    confirmReservation,
    cancelReservation,
    completeReservation,
    createManualReservation,
    listBlocks,
    createBlock,
    releaseBlock,
    listRates,
    getPricingPolicy,
    updatePricingPolicy,
    updateRates,
  };
}
