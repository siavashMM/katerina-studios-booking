import { describe, expect, it } from "vitest";
import { calculatePrice, dateRange, overlaps, transition, validateStay } from "./rules";

describe("stay dates", () => {
  it("counts calendar nights across daylight saving changes", () => {
    expect(dateRange("2027-03-27", "2027-03-30").nights).toBe(3);
    expect(dateRange("2028-02-28", "2028-03-01").nights).toBe(2);
  });
  it.each([
    ["2027-02-29", "2027-03-02"],
    ["2027-04-02", "2027-04-02"],
    ["2027-04-03", "2027-04-02"],
    ["2027-4-01", "2027-04-02"],
  ])("rejects invalid range %s %s", (start, end) => {
    expect(() => dateRange(start, end)).toThrow();
  });
  it("allows turnover on the same date", () => {
    expect(
      overlaps(dateRange("2027-04-01", "2027-04-04"), dateRange("2027-04-04", "2027-04-06")),
    ).toBe(false);
    expect(
      overlaps(dateRange("2027-04-01", "2027-04-04"), dateRange("2027-04-03", "2027-04-06")),
    ).toBe(true);
  });
  it("checks dates, stay limits, horizon and capacity", () => {
    const rules = {
      today: "2027-04-01",
      minimumStay: 2,
      maximumStay: 30,
      bookingHorizonDays: 365,
      maxGuests: 2,
    };
    expect(() =>
      validateStay({ checkIn: "2027-04-01", checkOut: "2027-04-03", guests: 2 }, rules),
    ).not.toThrow();
    for (const input of [
      { checkIn: "2027-03-31", checkOut: "2027-04-03", guests: 2 },
      { checkIn: "2027-04-01", checkOut: "2027-04-02", guests: 2 },
      { checkIn: "2027-04-01", checkOut: "2027-05-02", guests: 2 },
      { checkIn: "2028-04-01", checkOut: "2028-04-03", guests: 2 },
      { checkIn: "2027-04-01", checkOut: "2027-04-03", guests: 3 },
      { checkIn: "2027-04-01", checkOut: "2027-04-03", guests: 0 },
    ])
      expect(() => validateStay(input, rules)).toThrow();
  });
});

describe("prices", () => {
  it("prices every night with a seasonal override and exclusive end", () => {
    const result = calculatePrice(dateRange("2027-06-29", "2027-07-03"), 6000, [
      { startDate: "2027-07-01", endDate: "2027-07-03", priceCents: 7500 },
    ]);
    expect(result.totalCents).toBe(27000);
    expect(result.nightlyPrices.map((night) => night.amountCents)).toEqual([
      6000, 6000, 7500, 7500,
    ]);
  });
  it("rejects negative, fractional and overlapping rates", () => {
    for (const price of [-1, 1.5, Number.MAX_SAFE_INTEGER])
      expect(() => calculatePrice(dateRange("2027-04-01", "2027-04-03"), price, [])).toThrow();
    expect(() =>
      calculatePrice(dateRange("2027-04-01", "2027-04-03"), 10, [
        { startDate: "2027-04-01", endDate: "2027-04-03", priceCents: 20 },
        { startDate: "2027-04-02", endDate: "2027-04-04", priceCents: 30 },
      ]),
    ).toThrow();
  });
});

describe("reservation state", () => {
  it("supports idempotent valid transitions", () => {
    expect(transition("PENDING", "CONFIRMED", "2027-04-05", "2027-04-03")).toBe("CONFIRMED");
    expect(transition("CONFIRMED", "CONFIRMED", "2027-04-05", "2027-04-03")).toBe("CONFIRMED");
    expect(transition("CONFIRMED", "COMPLETED", "2027-04-05", "2027-04-05")).toBe("COMPLETED");
    expect(transition("PENDING", "CANCELLED", "2027-04-05", "2027-04-03")).toBe("CANCELLED");
  });
  it.each([
    ["PENDING", "COMPLETED"],
    ["CANCELLED", "CONFIRMED"],
    ["COMPLETED", "CANCELLED"],
    ["CONFIRMED", "PENDING"],
    ["CONFIRMED", "COMPLETED"],
  ] as const)("rejects %s to %s before checkout", (current, next) => {
    expect(() => transition(current, next, "2027-04-05", "2027-04-03")).toThrow();
  });
});
