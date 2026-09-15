import { type PrismaClient, type Prisma, type ReservationStatus } from "@prisma/client";
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
  lockAccommodation,
  mapDatabaseError,
  validate,
  type Transaction,
} from "../../booking/application/booking-service";

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

export function createAdminService(
  db: PrismaClient,
  options: { now?: () => Date; appUrl?: string } = {},
) {
  const now = options.now ?? (() => new Date());
  async function authorize(
    client: PrismaClient | Transaction,
    raw: AdminActor,
  ): Promise<AdminActor> {
    const actor = validate(actorSchema, raw);
    const membership = await client.ownerMembership.findFirst({
      where: { id: actor.id, propertyId: actor.propertyId, active: true },
      select: { id: true },
    });
    if (!membership) throw new DomainError("FORBIDDEN", "You do not have access to this property.");
    return actor;
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
    const actor = await authorize(db, rawActor);
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
  async function getReservation(rawActor: AdminActor, rawId: string) {
    const actor = await authorize(db, rawActor);
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
          },
        },
        audits: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!row) throw new DomainError("NOT_FOUND", "The reservation was not found.");
    return row;
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
          const actor = await authorize(tx, rawActor);
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

  async function listBlocks(rawActor: AdminActor) {
    const actor = await authorize(db, rawActor);
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
        const actor = await authorize(tx, rawActor);
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
      const actor = await authorize(tx, rawActor);
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
    const actor = await authorize(db, rawActor);
    return db.accommodation.findMany({
      where: { propertyId: actor.propertyId },
      include: { seasonalPrices: { orderBy: { startDate: "asc" } } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
  }
  async function updateRates(rawActor: AdminActor, raw: unknown) {
    const input = validate(ratesSchema, raw);
    calculatePrice(dateRange("2027-01-01", "2027-01-02"), input.basePriceCents, input.seasons);
    return db.$transaction(async (tx) => {
      const actor = await authorize(tx, rawActor);
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
    listReservations,
    getReservation,
    confirmReservation,
    cancelReservation,
    completeReservation,
    listBlocks,
    createBlock,
    releaseBlock,
    listRates,
    updateRates,
  };
}
