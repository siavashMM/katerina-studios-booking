import { z } from "zod";
export const reservationSearchSchema = z
  .object({
    search: z.string().trim().max(100).optional(),
    status: z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]).optional(),
  })
  .strict();
export const reservationSourceSchema = z.enum([
  "DIRECT",
  "MANUAL",
  "BOOKING_COM",
  "AIRBNB",
  "ICAL",
  "PHONE",
  "EMAIL",
  "OTHER",
]);
export const manualReservationSchema = z
  .object({
    idempotencyKey: z.uuid(),
    accommodationId: z.uuid(),
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z.coerce.number().int().min(1).max(20),
    source: reservationSourceSchema.exclude(["DIRECT", "ICAL"]),
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    email: z.email().max(254),
    phone: z.string().trim().max(40).optional(),
    country: z.string().trim().max(80).optional(),
    preferredLanguage: z.string().trim().max(20).optional(),
    internalNotes: z.string().trim().max(2000).optional(),
    totalCents: z.number().int().min(0).max(2_147_483_647).optional(),
    sendConfirmation: z.boolean().default(false),
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
  source: string;
  createdAt: string;
};
export function reservationListItem(
  row: Omit<ReservationListItem, "checkIn" | "checkOut" | "createdAt"> & {
    checkIn: Date;
    checkOut: Date;
    createdAt: Date;
  },
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
    source: row.source,
    createdAt: row.createdAt.toISOString(),
  };
}
