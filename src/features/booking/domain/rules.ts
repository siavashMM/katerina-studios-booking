export type ReservationState = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAVAILABLE"
  | "QUOTE_CHANGED"
  | "IDEMPOTENCY_CONFLICT"
  | "NOT_FOUND"
  | "BOOKING_DISABLED"
  | "INVALID_TRANSITION"
  | "EXTERNAL_CHANNELS_REQUIRED"
  | "FORBIDDEN";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

const dayMs = 86_400_000;
export type DateRange = { checkIn: string; checkOut: string; nights: number };

export function parseDate(value: string): Date {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new DomainError("VALIDATION_ERROR", "Enter a valid date.");
  }
  return parsed;
}

export function dateRange(checkIn: string, checkOut: string): DateRange {
  const nights = (parseDate(checkOut).getTime() - parseDate(checkIn).getTime()) / dayMs;
  if (nights <= 0) throw new DomainError("VALIDATION_ERROR", "Check-out must be after check-in.");
  return { checkIn, checkOut, nights };
}

export function overlaps(a: DateRange, b: DateRange): boolean {
  return a.checkIn < b.checkOut && a.checkOut > b.checkIn;
}

export function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
export function todayInAthens(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Athens",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)!.value)
    .join("-");
}

export function validateStay(
  input: { checkIn: string; checkOut: string; guests: number },
  rules: {
    today: string;
    minimumStay: number;
    maximumStay: number;
    bookingHorizonDays: number;
    maxGuests: number;
  },
): DateRange {
  const range = dateRange(input.checkIn, input.checkOut);
  const horizon = dateOnly(
    new Date(parseDate(rules.today).getTime() + rules.bookingHorizonDays * dayMs),
  );
  if (input.checkIn < rules.today)
    throw new DomainError("VALIDATION_ERROR", "Check-in cannot be in the past.");
  if (range.nights < rules.minimumStay || range.nights > rules.maximumStay)
    throw new DomainError(
      "VALIDATION_ERROR",
      `Select a stay from ${rules.minimumStay} to ${rules.maximumStay} nights.`,
    );
  if (input.checkOut > horizon)
    throw new DomainError("VALIDATION_ERROR", "Select dates within the booking period.");
  if (!Number.isInteger(input.guests) || input.guests < 1 || input.guests > rules.maxGuests)
    throw new DomainError("VALIDATION_ERROR", "The guest count exceeds the studio capacity.");
  return range;
}

export type SeasonalRate = { startDate: string; endDate: string; priceCents: number };
function validMoney(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > 2_147_483_647)
    throw new DomainError("VALIDATION_ERROR", "Enter a valid amount in cents.");
}

export function calculatePrice(range: DateRange, basePriceCents: number, seasons: SeasonalRate[]) {
  validMoney(basePriceCents);
  const sorted = [...seasons].sort((a, b) => a.startDate.localeCompare(b.startDate));
  sorted.forEach((season, index) => {
    dateRange(season.startDate, season.endDate);
    validMoney(season.priceCents);
    if (index > 0 && sorted[index - 1].endDate > season.startDate)
      throw new DomainError("VALIDATION_ERROR", "Seasonal price periods cannot overlap.");
  });
  const nightlyPrices = Array.from({ length: range.nights }, (_, index) => {
    const date = dateOnly(new Date(parseDate(range.checkIn).getTime() + index * dayMs));
    return {
      date,
      amountCents:
        sorted.find((season) => season.startDate <= date && date < season.endDate)?.priceCents ??
        basePriceCents,
    };
  });
  const totalCents = nightlyPrices.reduce((total, night) => total + night.amountCents, 0);
  validMoney(totalCents);
  return {
    nightlyPrices,
    subtotalCents: totalCents,
    totalCents,
    supplements: [] as { label: string; amountCents: number }[],
  };
}

export function transition(
  current: ReservationState,
  next: ReservationState,
  checkOut: string,
  today: string,
): ReservationState {
  if (current === next) return current;
  if (current === "PENDING" && (next === "CONFIRMED" || next === "CANCELLED")) return next;
  if (
    current === "CONFIRMED" &&
    (next === "CANCELLED" || (next === "COMPLETED" && today >= checkOut))
  )
    return next;
  throw new DomainError("INVALID_TRANSITION", "This reservation cannot change to that status.");
}
