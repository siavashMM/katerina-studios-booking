import { describe, expect, it } from "vitest";
import { reservationPriceDetails } from "./price-snapshot";

describe("reservation price details", () => {
  it("keeps safe nightly prices and supplements", () => {
    expect(
      reservationPriceDetails(
        {
          subtotalCents: 12000,
          nightlyPrices: [
            { date: "2027-06-01", amountCents: 6000 },
            { date: "2027-06-02", amountCents: 6000 },
          ],
          supplements: [{ label: "Cleaning", amountCents: 2000 }],
        },
        14000,
      ),
    ).toEqual({
      subtotalCents: 12000,
      nightlyPrices: [
        { date: "2027-06-01", amountCents: 6000 },
        { date: "2027-06-02", amountCents: 6000 },
      ],
      supplements: [{ label: "Cleaning", amountCents: 2000 }],
    });
  });

  it("uses the stored subtotal when the snapshot is not valid", () => {
    expect(reservationPriceDetails(null, 9000)).toEqual({
      subtotalCents: 9000,
      nightlyPrices: [],
      supplements: [],
    });
  });
});
