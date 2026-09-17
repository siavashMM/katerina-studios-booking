export type ReservationPriceDetails = {
  subtotalCents: number;
  nightlyPrices: { date: string; amountCents: number }[];
  supplements: { label: string; amountCents: number }[];
};

const isCents = (value: unknown): value is number =>
  Number.isSafeInteger(value) && Number(value) >= 0;

export function reservationPriceDetails(
  value: unknown,
  fallbackSubtotalCents: number,
): ReservationPriceDetails {
  if (!value || typeof value !== "object")
    return { subtotalCents: fallbackSubtotalCents, nightlyPrices: [], supplements: [] };
  const record = value as Record<string, unknown>;
  const nightlyPrices = Array.isArray(record.nightlyPrices)
    ? record.nightlyPrices.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        return typeof row.date === "string" && isCents(row.amountCents)
          ? [{ date: row.date, amountCents: row.amountCents }]
          : [];
      })
    : [];
  const supplements = Array.isArray(record.supplements)
    ? record.supplements.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as Record<string, unknown>;
        return typeof row.label === "string" && isCents(row.amountCents)
          ? [{ label: row.label, amountCents: row.amountCents }]
          : [];
      })
    : [];
  return {
    subtotalCents: isCents(record.subtotalCents) ? record.subtotalCents : fallbackSubtotalCents,
    nightlyPrices,
    supplements,
  };
}
