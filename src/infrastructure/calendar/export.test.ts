import { describe, expect, it } from "vitest";
import { createCalendarToken, renderAvailabilityCalendar, verifyCalendarToken } from "./export";

describe("iCal availability export", () => {
  it("signs a private feed token and exports dates without guest data", () => {
    const secret = "a".repeat(64);
    const token = createCalendarToken("studio-1", secret);
    expect(verifyCalendarToken("studio-1", token, secret)).toBe(true);
    expect(verifyCalendarToken("studio-2", token, secret)).toBe(false);
    const calendar = renderAvailabilityCalendar("Demo Studio", [
      { id: "allocation-1", start: "2027-06-01", end: "2027-06-04" },
    ]);
    expect(calendar).toContain("DTSTART;VALUE=DATE:20270601");
    expect(calendar).toContain("SUMMARY:Unavailable");
    expect(calendar).not.toContain("Guest");
  });
});
