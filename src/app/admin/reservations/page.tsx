import { ownerForPage } from "@/features/admin/page-auth";
import { adminService } from "@/features/booking/server";
import { reservationListItem } from "@/features/admin/contracts/reservations";
import { ReservationsList } from "@/features/admin/ui/reservations-list";
import { dateOnly, todayInAthens } from "@/features/booking/domain/rules";
import { reservationPriceDetails } from "@/features/admin/domain/price-snapshot";

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const owner = await ownerForPage();
  const service = adminService();
  const [rows, studios, context, query] = await Promise.all([
    service.listReservations(owner),
    service.listAccommodationsForOwner(owner),
    service.getPortalContext(owner),
    searchParams,
  ]);
  const selectedId = query.selected ?? rows[0]?.id;
  const detail = selectedId
    ? await service.getReservation(owner, selectedId).catch(() => null)
    : null;
  return (
    <ReservationsList
      initialRows={rows.map(reservationListItem)}
      studios={studios}
      fullControl={context.property.portalPlan === "FULL_CONTROL"}
      selected={
        detail
          ? {
              ...reservationListItem(detail),
              email: detail.email,
              phone: detail.phone,
              country: detail.country,
              preferredLanguage: detail.preferredLanguage,
              arrivalTime: detail.arrivalTime,
              internalNotes: detail.internalNotes,
              specialRequests: detail.specialRequests,
              paymentMethod: detail.paymentMethod,
              priceIsKnown: detail.priceIsKnown,
              priceDetails: reservationPriceDetails(detail.priceSnapshot, detail.subtotalCents),
              canComplete: dateOnly(detail.checkOut) <= todayInAthens(new Date()),
            }
          : null
      }
    />
  );
}
