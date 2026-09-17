import type { CalendarChannelEvent } from "./provider";

function icalDate(value: string) {
  const match = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  if (!match) throw new Error("The iCal feed contains an invalid date.");
  const result = `${match[1]}-${match[2]}-${match[3]}`;
  if (new Date(`${result}T00:00:00.000Z`).toISOString().slice(0, 10) !== result)
    throw new Error("The iCal feed contains an invalid date.");
  return result;
}

export function parseIcal(value: string): CalendarChannelEvent[] {
  if (value.length > 1_000_000) throw new Error("The iCal feed is too large.");
  const lines = value.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
  const events: CalendarChannelEvent[] = [];
  let current: Record<string, string> | null = null;
  for (const line of lines) {
    if (line === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line === "END:VEVENT") {
      if (!current?.UID) throw new Error("The iCal feed contains an event without an ID.");
      const cancelled = current.STATUS?.toUpperCase() === "CANCELLED";
      if (!cancelled && (!current.DTSTART || !current.DTEND))
        throw new Error("The iCal feed contains an event without dates.");
      events.push({
        externalId: current.UID.slice(0, 500),
        start: current.DTSTART ? icalDate(current.DTSTART) : "1970-01-01",
        end: current.DTEND ? icalDate(current.DTEND) : "1970-01-02",
        ...(current.SUMMARY
          ? {
              summary: current.SUMMARY.replace(/\\([nN,;\\])/g, (_match, char: string) =>
                char.toLowerCase() === "n" ? "\n" : char,
              ).slice(0, 300),
            }
          : {}),
        cancelled,
      });
      current = null;
      if (events.length > 5000) throw new Error("The iCal feed has too many events.");
      continue;
    }
    if (!current) continue;
    const separator = line.indexOf(":");
    if (separator < 1) continue;
    const name = line.slice(0, separator).split(";", 1)[0].toUpperCase();
    if (["UID", "DTSTART", "DTEND", "SUMMARY", "STATUS"].includes(name))
      current[name] = line.slice(separator + 1);
  }
  const ids = new Set<string>();
  for (const event of events) {
    if (ids.has(event.externalId)) throw new Error("The iCal feed contains duplicate event IDs.");
    if (!event.cancelled && event.start >= event.end)
      throw new Error("The iCal feed contains an invalid date range.");
    ids.add(event.externalId);
  }
  return events;
}
