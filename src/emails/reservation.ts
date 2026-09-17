import { z } from "zod";

const schema = z.object({
  reference: z.string(),
  guestName: z.string(),
  guestEmail: z.string().optional(),
  guestPhone: z.string().optional(),
  accommodationName: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  guestCount: z.number().int().optional(),
  nights: z.number().int().optional(),
  arrivalTime: z.string().optional(),
  specialRequests: z.string().optional(),
  totalCents: z.number().int(),
  currency: z.literal("EUR"),
  policySummary: z.string(),
  paymentMethod: z.string().optional(),
  messageSubject: z.string().optional(),
  messageBody: z.string().optional(),
  adminUrl: z.url().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  arrivalInstructions: z.string().optional(),
  checkInInformation: z.string().optional(),
  checkOutInformation: z.string().optional(),
});
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

const money = (cents: number) => `EUR ${(cents / 100).toFixed(2)}`;

export function renderEmail(kind: string, raw: unknown) {
  const data = schema.parse(raw);
  const subjects: Record<string, string> = {
    OWNER_REQUESTED: "New booking request - Katerina Studios",
    GUEST_REQUESTED: "Booking request received - Katerina Studios",
    GUEST_CONFIRMED: "Reservation confirmed - Katerina Studios",
    GUEST_CANCELLED: "Reservation cancelled - Katerina Studios",
  };
  const owner = kind === "OWNER_REQUESTED";
  const lines = owner
    ? [
        "A new booking request needs your review.",
        `Reference: ${data.reference}`,
        `Guest: ${data.guestName}`,
        `Email: ${data.guestEmail ?? "Not provided"}`,
        `Phone: ${data.guestPhone ?? "Not provided"}`,
        `Studio: ${data.accommodationName}`,
        `Check-in: ${data.checkIn}`,
        `Check-out: ${data.checkOut}`,
        `Nights: ${data.nights ?? "Not provided"}`,
        `Guests: ${data.guestCount ?? "Not provided"}`,
        `Expected arrival: ${data.arrivalTime ?? "Not provided"}`,
        `Total: ${money(data.totalCents)}`,
        `Special request: ${data.specialRequests ?? "None"}`,
      ]
    : kind === "GUEST_REQUESTED"
      ? [
          `Hello ${data.guestName},`,
          "We received your booking request.",
          "Your reservation is not confirmed yet.",
          "We will send another email after the property confirms availability.",
          `Reference: ${data.reference}`,
          `Studio: ${data.accommodationName}`,
          `${data.checkIn} to ${data.checkOut}`,
          `Total: ${money(data.totalCents)}`,
        ]
      : kind === "GUEST_CONFIRMED"
        ? [
            `Hello ${data.guestName},`,
            "Your reservation is confirmed.",
            `Reference: ${data.reference}`,
            `Studio: ${data.accommodationName}`,
            `Check-in: ${data.checkIn}${data.checkInInformation ? ` · ${data.checkInInformation}` : ""}`,
            `Check-out: ${data.checkOut}${data.checkOutInformation ? ` · ${data.checkOutInformation}` : ""}`,
            `Nights: ${data.nights ?? "Not provided"}`,
            `Guests: ${data.guestCount ?? "Not provided"}`,
            `Total: ${money(data.totalCents)}`,
            "Payment method: Cash on arrival.",
            "Pay the total amount in cash when you arrive.",
            data.arrivalTime
              ? `Expected arrival: ${data.arrivalTime}`
              : "Contact Katerina Studios before arrival if your arrival time changes.",
            ...(data.arrivalInstructions
              ? [`Arrival information: ${data.arrivalInstructions}`]
              : []),
            ...(data.contactEmail ? [`Property email: ${data.contactEmail}`] : []),
            ...(data.contactPhone ? [`Property phone: ${data.contactPhone}`] : []),
          ]
        : kind === "GUEST_CANCELLED"
          ? [
              `Hello ${data.guestName},`,
              "Your reservation is cancelled.",
              `Reference: ${data.reference}`,
              `Studio: ${data.accommodationName}`,
              `${data.checkIn} to ${data.checkOut}`,
            ]
          : kind === "OWNER_MESSAGE" && data.messageSubject && data.messageBody
            ? [`Hello ${data.guestName},`, data.messageBody, `Reservation: ${data.reference}`]
            : null;
  if (!lines) throw new Error("Unsupported notification type");
  const adminUrl =
    owner && data.adminUrl && new URL(data.adminUrl).protocol === "https:"
      ? data.adminUrl
      : undefined;
  const subject = kind === "OWNER_MESSAGE" ? data.messageSubject! : subjects[kind];
  if (!subject) throw new Error("Unsupported notification type");
  return {
    subject,
    text: lines.join("\n\n") + (adminUrl ? `\n\nOpen the owner area: ${adminUrl}` : ""),
    html: `<html><body>${lines
      .map((line) => `<p>${escape(line)}</p>`)
      .join(
        "",
      )}${adminUrl ? `<p><a href="${escape(adminUrl)}">Open the owner area</a></p>` : ""}</body></html>`,
  };
}
