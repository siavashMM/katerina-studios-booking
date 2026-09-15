import { z } from "zod";
export const reservationSearchSchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  })
  .strict();
export type ReservationListItem = {
  id: string;
  reference: string;
  firstName: string;
  lastName: string;
  accommodation: { name: string };
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  totalCents: number;
  status: string;
};
export function reservationListItem(
  row: Omit<ReservationListItem, "checkIn" | "checkOut"> & { checkIn: Date; checkOut: Date },
): ReservationListItem {
  return {
    id: row.id,
    reference: row.reference,
    firstName: row.firstName,
    lastName: row.lastName,
    accommodation: { name: row.accommodation.name },
    checkIn: row.checkIn.toISOString(),
    checkOut: row.checkOut.toISOString(),
    guests: row.guests,
    nights: row.nights,
    totalCents: row.totalCents,
    status: row.status,
  };
}
