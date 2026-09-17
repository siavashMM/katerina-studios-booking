import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { Prisma, type PrismaClient, type Reservation } from "@prisma/client";
import { z } from "zod";
import {
  quoteSchema,
  requestSchema,
  staySchema,
  type AccommodationDTO,
  type AvailabilityResult,
  type BookingQuote,
  type BookingReceipt,
  type QuoteInput,
} from "../contracts/booking";
import {
  calculatePrice,
  dateOnly,
  DomainError,
  parseDate,
  todayInAthens,
  validateStay,
} from "../domain/rules";

export type BookingServiceOptions = {
  now?: () => Date;
  receiptSecret: string;
  propertySlug?: string;
  demoMode?: boolean;
  ownerNotificationEmail?: string;
  appUrl?: string;
};
export type Transaction = Prisma.TransactionClient;
export const hash = (value: string) => createHash("sha256").update(value).digest("hex");
export function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success)
    throw new DomainError("VALIDATION_ERROR", "Check the form fields and try again.");
  return parsed.data;
}

export function mapDatabaseError(error: unknown): never {
  if (error instanceof DomainError) throw error;
  const message = error instanceof Error ? error.message : "";
  if (/inventory_no_active_overlap|exclusion constraint|23P01/.test(message))
    throw new DomainError("UNAVAILABLE", "The studio is not available for these dates.");
  throw error;
}

export async function lockAccommodation(
  tx: Transaction,
  id: string,
  propertyId?: string,
): Promise<void> {
  const rows = await tx.$queryRaw<
    { id: string; propertyId: string }[]
  >`SELECT "id", "propertyId" FROM "Accommodation" WHERE "id" = ${id}::uuid FOR UPDATE`;
  if (!rows[0] || (propertyId && rows[0].propertyId !== propertyId))
    throw new DomainError("NOT_FOUND", "The studio was not found.");
}

export async function ensureAvailable(
  tx: Transaction,
  accommodationId: string,
  checkIn: string,
  checkOut: string,
): Promise<void> {
  const allocation = await tx.inventoryAllocation.findFirst({
    where: {
      accommodationId,
      active: true,
      startDate: { lt: parseDate(checkOut) },
      endDate: { gt: parseDate(checkIn) },
    },
    select: { id: true },
  });
  if (allocation)
    throw new DomainError("UNAVAILABLE", "The studio is not available for these dates.");
}

type ReservationWithAccommodation = Reservation & {
  accommodation: { name: string; isDemo: boolean };
};
export function toReceipt(reservation: ReservationWithAccommodation): BookingReceipt {
  const snapshot = reservation.priceSnapshot as unknown as BookingQuote;
  return {
    ...snapshot,
    reference: reservation.reference,
    status: reservation.status,
    guestName: `${reservation.firstName} ${reservation.lastName}`,
    createdAt: reservation.createdAt.toISOString(),
  };
}

export async function enqueueReservationEmail(
  tx: Transaction,
  reservation: ReservationWithAccommodation,
  kind: string,
  recipient: string,
  appUrl?: string,
): Promise<void> {
  const snapshot = reservation.priceSnapshot as unknown as BookingQuote;
  const content = await tx.propertyContent.findUnique({
    where: { propertyId: reservation.propertyId },
    select: {
      contactEmail: true,
      contactPhone: true,
      arrivalInstructions: true,
      checkIn: true,
      checkOut: true,
    },
  });
  await tx.emailOutbox.create({
    data: {
      reservationId: reservation.id,
      kind,
      recipient,
      idempotencyKey: `${reservation.id}:${kind}:${reservation.version}`,
      payload: {
        reference: reservation.reference,
        guestName: `${reservation.firstName} ${reservation.lastName}`,
        guestEmail: reservation.email,
        guestPhone: reservation.phone,
        accommodationName: reservation.accommodation.name,
        checkIn: dateOnly(reservation.checkIn),
        checkOut: dateOnly(reservation.checkOut),
        guestCount: reservation.guests,
        nights: reservation.nights,
        arrivalTime: reservation.arrivalTime,
        specialRequests: reservation.specialRequests,
        totalCents: reservation.totalCents,
        currency: reservation.currency,
        policySummary: snapshot.policy.summary,
        cashOnArrival: true,
        paymentMethod: "CASH_ON_ARRIVAL",
        ...(content?.contactEmail ? { contactEmail: content.contactEmail } : {}),
        ...(content?.contactPhone ? { contactPhone: content.contactPhone } : {}),
        ...(content?.arrivalInstructions
          ? { arrivalInstructions: content.arrivalInstructions }
          : {}),
        ...(content?.checkIn ? { checkInInformation: content.checkIn } : {}),
        ...(content?.checkOut ? { checkOutInformation: content.checkOut } : {}),
        status: reservation.status,
        reservationVersion: reservation.version,
        ...(appUrl ? { adminUrl: `${appUrl}/admin/reservations/${reservation.id}` } : {}),
      },
    },
  });
}

export function createBookingService(db: PrismaClient, options: BookingServiceOptions) {
  if (options.receiptSecret.length < 32)
    throw new Error("The receipt secret must have at least 32 characters.");
  const now = options.now ?? (() => new Date());
  const slug = options.propertySlug ?? "katerina-studios";
  function receiptToken(reservation: Pick<Reservation, "id" | "idempotencyKey">) {
    return createHmac("sha256", options.receiptSecret)
      .update(`${reservation.id}:${reservation.idempotencyKey}`)
      .digest("base64url");
  }

  async function buildQuote(tx: Transaction, input: QuoteInput): Promise<BookingQuote> {
    const accommodation = await tx.accommodation.findFirst({
      where: { id: input.accommodationId, active: true, property: { slug } },
      include: {
        seasonalPrices: true,
        property: { include: { policies: { where: { active: true }, take: 1 } } },
      },
    });
    if (!accommodation) throw new DomainError("NOT_FOUND", "The studio was not found.");
    const property = accommodation.property;
    const policy = property.policies[0];
    const safeDemo =
      options.demoMode === true && property.isDemo && accommodation.isDemo && policy?.isDemo;
    const verifiedLive =
      !options.demoMode &&
      !property.isDemo &&
      !accommodation.isDemo &&
      !policy?.isDemo &&
      property.bookingEnabled &&
      property.verifiedAt;
    if (!policy || (!safeDemo && !verifiedLive))
      throw new DomainError(
        "BOOKING_DISABLED",
        "Booking requests are not available. Contact the property.",
      );
    const range = validateStay(input, {
      today: todayInAthens(now()),
      minimumStay: property.minimumStay,
      maximumStay: property.maximumStay,
      bookingHorizonDays: property.bookingHorizonDays,
      maxGuests: accommodation.maxGuests,
    });
    await ensureAvailable(tx, accommodation.id, input.checkIn, input.checkOut);
    const price = calculatePrice(
      range,
      accommodation.basePriceCents,
      accommodation.seasonalPrices.map((season) => ({
        startDate: dateOnly(season.startDate),
        endDate: dateOnly(season.endDate),
        priceCents: season.priceCents,
      })),
    );
    const quote = {
      accommodationId: input.accommodationId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      guests: input.guests,
      accommodationName: accommodation.name,
      nights: range.nights,
      currency: "EUR" as const,
      ...price,
      policy: { id: policy.id, version: policy.version, summary: policy.summary },
      cashOnArrival: true as const,
      demo: !!safeDemo,
    };
    return { ...quote, fingerprint: hash(JSON.stringify(quote)) };
  }

  async function listAccommodations(): Promise<AccommodationDTO[]> {
    const units = await db.accommodation.findMany({
      where: { active: true, property: { slug } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    return units.map((unit) => ({
      id: unit.id,
      slug: unit.slug,
      name: unit.name,
      maxGuests: unit.maxGuests,
      basePriceCents: unit.basePriceCents,
      demo: unit.isDemo,
    }));
  }

  async function getQuote(raw: unknown): Promise<BookingQuote> {
    const input = validate(quoteSchema, raw);
    return db.$transaction(async (tx) => {
      await lockAccommodation(tx, input.accommodationId);
      return buildQuote(tx, input);
    });
  }

  async function getAvailability(raw: unknown): Promise<AvailabilityResult> {
    const input = validate(staySchema, raw);
    const property = await db.property.findUnique({ where: { slug } });
    if (!property)
      throw new DomainError(
        "BOOKING_DISABLED",
        "Booking requests are not available. Contact the property.",
      );
    validateStay(input, { today: todayInAthens(now()), ...property, maxGuests: 20 });
    const accommodations = await db.accommodation.findMany({
      where: { propertyId: property.id, active: true, maxGuests: { gte: input.guests } },
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
      select: { id: true },
    });
    const quotes: BookingQuote[] = [];
    for (const accommodation of accommodations) {
      try {
        quotes.push(await getQuote({ ...input, accommodationId: accommodation.id }));
      } catch (error) {
        if (!(error instanceof DomainError && error.code === "UNAVAILABLE")) throw error;
      }
    }
    return { quotes, demo: property.isDemo };
  }

  async function createRequest(raw: unknown) {
    const input = validate(requestSchema, raw);
    const payloadHash = hash(JSON.stringify(input));
    try {
      return await db.$transaction(
        async (tx) => {
          // One transaction owns a submission key. A retry precedes all fresh availability checks.
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${input.idempotencyKey}, 0))`;
          const previous = await tx.reservation.findUnique({
            where: { idempotencyKey: input.idempotencyKey },
            include: { accommodation: { select: { name: true, isDemo: true } } },
          });
          if (previous) {
            if (previous.payloadHash !== payloadHash)
              throw new DomainError(
                "IDEMPOTENCY_CONFLICT",
                "This request key was already used with different details.",
              );
            return {
              receipt: toReceipt(previous),
              receiptToken: receiptToken(previous),
              replayed: true,
            };
          }
          await lockAccommodation(tx, input.accommodationId);
          const quote = await buildQuote(tx, {
            accommodationId: input.accommodationId,
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            guests: input.guests,
          });
          if (quote.fingerprint !== input.quoteFingerprint)
            throw new DomainError(
              "QUOTE_CHANGED",
              "The price or policy changed. Review the new quote.",
            );
          const property = await tx.property.findUniqueOrThrow({ where: { slug } });
          const id = randomUUID();
          const token = receiptToken({ id, idempotencyKey: input.idempotencyKey });
          const reservation = await tx.reservation.create({
            data: {
              id,
              propertyId: property.id,
              accommodationId: input.accommodationId,
              policyVersionId: quote.policy.id,
              reference: `KS-${randomBytes(10).toString("hex").toUpperCase()}`,
              idempotencyKey: input.idempotencyKey,
              payloadHash,
              receiptTokenHash: hash(token),
              checkIn: parseDate(input.checkIn),
              checkOut: parseDate(input.checkOut),
              guests: input.guests,
              nights: quote.nights,
              ...input.guest,
              subtotalCents: quote.subtotalCents,
              totalCents: quote.totalCents,
              priceSnapshot: JSON.parse(JSON.stringify(quote)) as Prisma.InputJsonValue,
              policySnapshot: quote.policy,
              quoteFingerprint: quote.fingerprint,
              policyAcceptedAt: now(),
              createdAt: now(),
            },
            include: { accommodation: { select: { name: true, isDemo: true } } },
          });
          await enqueueReservationEmail(
            tx,
            reservation,
            "GUEST_REQUESTED",
            reservation.email,
            options.appUrl,
          );
          const ownerEmail = options.ownerNotificationEmail ?? property.ownerNotificationEmail;
          if (!ownerEmail)
            throw new DomainError(
              "BOOKING_DISABLED",
              "Booking requests are not available. Contact the property.",
            );
          await enqueueReservationEmail(
            tx,
            reservation,
            "OWNER_REQUESTED",
            ownerEmail,
            options.appUrl,
          );
          await tx.auditEvent.create({
            data: {
              propertyId: property.id,
              reservationId: reservation.id,
              action: "RESERVATION_REQUESTED",
              metadata: { version: 1 },
            },
          });
          return { receipt: toReceipt(reservation), receiptToken: token, replayed: false };
        },
        { maxWait: 5000, timeout: 10000 },
      );
    } catch (error) {
      return mapDatabaseError(error);
    }
  }

  async function getReceipt(reference: string, token: string): Promise<BookingReceipt> {
    if (!/^KS-[A-F0-9]{20}$/.test(reference) || token.length > 200)
      throw new DomainError("NOT_FOUND", "The booking request was not found.");
    const reservation = await db.reservation.findUnique({
      where: { reference },
      include: { accommodation: { select: { name: true, isDemo: true } } },
    });
    const actual = Buffer.from(hash(token));
    const expected = Buffer.from(reservation?.receiptTokenHash ?? hash("unknown"));
    if (
      !reservation ||
      !timingSafeEqual(actual, expected) ||
      now().getTime() > reservation.createdAt.getTime() + 60 * 60 * 1000
    )
      throw new DomainError("NOT_FOUND", "The booking request was not found.");
    return toReceipt(reservation);
  }
  return { listAccommodations, getAvailability, getQuote, createRequest, getReceipt };
}
