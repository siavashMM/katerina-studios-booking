import { describe, expect, it } from "vitest";
import { parseIcal } from "./parser";

describe("iCal provider", () => {
  it("parses date events and keeps a stable external ID", () => {
    const events = parseIcal(
      [
        "BEGIN:VCALENDAR",
        "BEGIN:VEVENT",
        "UID:booking-42@example.test",
        "DTSTART;VALUE=DATE:20270601",
        "DTEND;VALUE=DATE:20270604",
        "SUMMARY:External guest",
        "END:VEVENT",
        "END:VCALENDAR",
      ].join("\r\n"),
    );

    expect(events).toEqual([
      {
        externalId: "booking-42@example.test",
        start: "2027-06-01",
        end: "2027-06-04",
        summary: "External guest",
        cancelled: false,
      },
    ]);
  });

  it("rejects malformed or duplicate events", () => {
    expect(() =>
      parseIcal("BEGIN:VEVENT\nUID:a\nDTSTART:bad\nDTEND:20270604\nEND:VEVENT"),
    ).toThrow();
    const duplicate =
      "BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:a\nDTSTART;VALUE=DATE:20270601\nDTEND;VALUE=DATE:20270602\nEND:VEVENT\nBEGIN:VEVENT\nUID:a\nDTSTART;VALUE=DATE:20270603\nDTEND;VALUE=DATE:20270604\nEND:VEVENT\nEND:VCALENDAR";
    expect(() => parseIcal(duplicate)).toThrow();
  });
});
