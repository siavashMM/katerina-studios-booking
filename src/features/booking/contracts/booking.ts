import { z } from "zod";
import type { ReservationState } from "../domain/rules";

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const optionalText = (max: number) => z.string().trim().max(max).optional();
export const staySchema = z
  .object({ checkIn: date, checkOut: date, guests: z.number().int().min(1).max(20) })
  .strict();
export const quoteSchema = staySchema.extend({ accommodationId: z.uuid() }).strict();
export const requestSchema = quoteSchema
  .extend({
    idempotencyKey: z.uuid(),
    quoteFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    guest: z
      .object({
        firstName: z.string().trim().min(1).max(80),
        lastName: z.string().trim().min(1).max(80),
        email: z.email().trim().toLowerCase().max(254),
        phone: optionalText(40),
        country: optionalText(80),
        arrivalTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
          .optional()
          .or(z.literal("")),
        specialRequests: optionalText(1000),
      })
      .strict(),
    policyAccepted: z.literal(true),
  })
  .strict();

export type StayInput = z.infer<typeof staySchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type BookingRequestInput = z.infer<typeof requestSchema>;
export type BookingQuote = QuoteInput & {
  fingerprint: string;
  accommodationName: string;
  nights: number;
  currency: "EUR";
  subtotalCents: number;
  totalCents: number;
  nightlyPrices: { date: string; amountCents: number }[];
  supplements: { label: string; amountCents: number }[];
  policy: { id: string; version: number; summary: string };
  cashOnArrival: true;
  demo: boolean;
};
export type BookingReceipt = BookingQuote & {
  reference: string;
  status: ReservationState;
  guestName: string;
  createdAt: string;
};
export type AccommodationDTO = {
  id: string;
  slug: string;
  name: string;
  maxGuests: number;
  basePriceCents: number;
  demo: boolean;
};
export type AvailabilityResult = { quotes: BookingQuote[]; demo: boolean };
