import { DomainError } from "@/features/booking/domain/rules";

export type PortalPlan = "OWNER_CONTROL" | "FULL_CONTROL";

export type PortalCapabilities = {
  canManageReservations: boolean;
  canManageCalendar: boolean;
  canSendGuestMessages: boolean;
  canManageWebsiteContent: boolean;
  canManagePhotos: boolean;
  canManagePricing: boolean;
  canManageAmenities: boolean;
  canManagePolicies: boolean;
  canConfigureChannels: boolean;
};

const ownerControl: PortalCapabilities = {
  canManageReservations: true,
  canManageCalendar: true,
  canSendGuestMessages: true,
  canManageWebsiteContent: false,
  canManagePhotos: false,
  canManagePricing: false,
  canManageAmenities: false,
  canManagePolicies: false,
  canConfigureChannels: false,
};

const fullControl: PortalCapabilities = Object.fromEntries(
  Object.keys(ownerControl).map((key) => [key, true]),
) as PortalCapabilities;

export function capabilitiesFor(plan: PortalPlan): PortalCapabilities {
  return plan === "FULL_CONTROL" ? { ...fullControl } : { ...ownerControl };
}

export function requireCapability(plan: PortalPlan, capability: keyof PortalCapabilities): void {
  if (!capabilitiesFor(plan)[capability]) {
    throw new DomainError("FORBIDDEN", "Your plan does not include this feature.");
  }
}
