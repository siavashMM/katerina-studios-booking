import { z } from "zod";

const schema = z.object({
  reference: z.string(),
  guestName: z.string(),
  accommodationName: z.string(),
  checkIn: z.string(),
  checkOut: z.string(),
  totalCents: z.number().int(),
  currency: z.literal("EUR"),
  policySummary: z.string(),
  adminUrl: z.url().optional(),
});
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );

export function renderEmail(kind: string, raw: unknown) {
  const data = schema.parse(raw);
  const owner = kind === "OWNER_REQUESTED";
  const status =
    kind === "GUEST_REQUESTED"
      ? "We received your booking request. Your reservation is not confirmed yet."
      : kind === "GUEST_CONFIRMED"
        ? "Your reservation is confirmed. Pay in cash on arrival."
        : kind === "GUEST_CANCELLED"
          ? "Your reservation is cancelled."
          : owner
            ? "A new booking request needs your review."
            : null;
  if (!status) throw new Error("Unsupported notification type");
  const lines = owner
    ? [status, data.reference, `${data.checkIn} to ${data.checkOut}`]
    : [
        `Hello ${data.guestName},`,
        status,
        data.reference,
        data.accommodationName,
        `${data.checkIn} to ${data.checkOut}`,
        `Total: EUR ${(data.totalCents / 100).toFixed(2)}`,
        data.policySummary,
      ];
  const adminUrl =
    owner && data.adminUrl && new URL(data.adminUrl).protocol === "https:"
      ? data.adminUrl
      : undefined;
  return {
    subject: `Katerina Studios: ${data.reference}`,
    text: lines.join("\n\n") + (adminUrl ? `\n\nOpen the owner area: ${adminUrl}` : ""),
    html: `<html><body>${lines.map((line) => `<p>${escape(line)}</p>`).join("")}${adminUrl ? `<p><a href="${escape(adminUrl)}">Open the owner area</a></p>` : ""}</body></html>`,
  };
}
