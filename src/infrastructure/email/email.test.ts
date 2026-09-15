import { describe, expect, it } from "vitest";
import { renderEmail } from "@/emails/reservation";
import { ResendEmailProvider } from "./provider";

const payload = {
  reference: "KS-12345678901234567890",
  guestName: '<script>alert("x")</script>',
  accommodationName: "Demo studio",
  checkIn: "2027-04-01",
  checkOut: "2027-04-03",
  guestCount: 2,
  nights: 2,
  totalCents: 12000,
  currency: "EUR",
  policySummary: "Demo policy",
  status: "PENDING",
  cashOnArrival: true,
  adminUrl: "https://stay.example/admin/reservations/abc",
};
describe("email boundary", () => {
  it("escapes guest content in HTML", () => {
    const email = renderEmail("GUEST_REQUESTED", payload);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.text).toContain("not confirmed");
  });
  it("keeps guest details out of the owner notification", () => {
    const email = renderEmail("OWNER_REQUESTED", payload);
    expect(email.text).not.toContain(payload.guestName);
    expect(email.html).toContain("Open the owner area");
  });
  it("captures demo mail even when a provider key exists", async () => {
    const provider = new ResendEmailProvider({
      demo: true,
      key: "must-not-be-used",
      from: "Demo <demo@example.test>",
    });
    expect(
      (
        await provider.send({
          to: "real@example.test",
          subject: "Test",
          html: "Test",
          text: "Test",
          idempotencyKey: "test",
        })
      ).captured,
    ).toBe(true);
  });
});
