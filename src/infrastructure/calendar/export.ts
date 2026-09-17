import { createHmac, timingSafeEqual } from "node:crypto";

export function createCalendarToken(accommodationId: string, secret: string) {
  if (secret.length < 32)
    throw new Error("The iCal export secret must have at least 32 characters.");
  return createHmac("sha256", secret).update(`ical:${accommodationId}`).digest("base64url");
}

export function verifyCalendarToken(accommodationId: string, token: string, secret: string) {
  if (token.length > 100 || secret.length < 32) return false;
  const expected = Buffer.from(createCalendarToken(accommodationId, secret));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const compact = (date: string) => date.replaceAll("-", "");
const escapeIcal = (value: string) => value.replace(/([,;\\])/g, "\\$1").replace(/\r?\n/g, "\\n");

export function renderAvailabilityCalendar(
  accommodationName: string,
  allocations: { id: string; start: string; end: string }[],
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Katerina Studios//Availability//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeIcal(accommodationName)} availability`,
  ];
  for (const allocation of allocations) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${escapeIcal(allocation.id)}@katerina-studios`,
      `DTSTART;VALUE=DATE:${compact(allocation.start)}`,
      `DTEND;VALUE=DATE:${compact(allocation.end)}`,
      "SUMMARY:Unavailable",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
