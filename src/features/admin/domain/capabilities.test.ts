import { describe, expect, it } from "vitest";
import { capabilitiesFor, requireCapability } from "./capabilities";

describe("owner portal capabilities", () => {
  it("gives Owner Control all daily reservation tools", () => {
    const capabilities = capabilitiesFor("OWNER_CONTROL");

    expect(capabilities.canManageReservations).toBe(true);
    expect(capabilities.canManageCalendar).toBe(true);
    expect(capabilities.canSendGuestMessages).toBe(true);
    expect(capabilities.canManageWebsiteContent).toBe(false);
    expect(capabilities.canManagePhotos).toBe(false);
    expect(capabilities.canManagePricing).toBe(false);
  });

  it("gives Full Control all owner and website tools", () => {
    const capabilities = capabilitiesFor("FULL_CONTROL");

    expect(Object.values(capabilities).every(Boolean)).toBe(true);
  });

  it("rejects a capability that the plan does not include", () => {
    expect(() => requireCapability("OWNER_CONTROL", "canManagePricing")).toThrowError(
      "Your plan does not include this feature.",
    );
  });
});
