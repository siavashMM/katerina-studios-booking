import { describe, expect, it } from "vitest";
import { renderEmail } from "@/emails/reservation";
import { ResendEmailProvider } from "./provider";

const payload = {
  reference: "KS-12345678901234567890",
  guestName: '<script>alert("x")</script>',
  guestEmail: "guest@example.test",
  guestPhone: "+30 000 000 000",
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
  contactEmail: "stay@example.test",
  contactPhone: "+30 123 456 7890",
  arrivalInstructions: "Call the property when you reach the main road.",
  checkInInformation: "From 15:00",
  checkOutInformation: "Before 11:00",
};
describe("email boundary", () => {
  it("escapes guest content in HTML", () => {
    const email = renderEmail("GUEST_REQUESTED", payload);
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
    expect(email.text).toContain("not confirmed");
  });
  it("gives the owner the booking details needed for review", () => {
    const email = renderEmail("OWNER_REQUESTED", payload);
    expect(email.subject).toBe("New booking request - Katerina Studios");
    expect(email.text).toContain(payload.guestName);
    expect(email.text).toContain(payload.guestEmail);
    expect(email.html).toContain("Open the owner area");
  });
  it("uses clear request and confirmation subjects", () => {
    expect(renderEmail("GUEST_REQUESTED", payload).subject).toBe(
      "Booking request received - Katerina Studios",
    );
    expect(renderEmail("GUEST_CONFIRMED", payload).subject).toBe(
      "Reservation confirmed - Katerina Studios",
    );
    expect(renderEmail("GUEST_CONFIRMED", payload).text).toContain(payload.arrivalInstructions);
    expect(renderEmail("GUEST_CONFIRMED", payload).text).toContain(payload.contactEmail);
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
