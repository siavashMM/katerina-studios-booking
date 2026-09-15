import { ownerForPage } from "@/features/admin/page-auth";
import { adminService } from "@/features/booking/server";
import { reservationListItem } from "@/features/admin/contracts/reservations";
import { ReservationsList } from "@/features/admin/ui/reservations-list";
export default async function ReservationsPage() {
  const owner = await ownerForPage();
  const rows = await adminService().listReservations(owner);
  return <ReservationsList initialRows={rows.map(reservationListItem)} />;
}
