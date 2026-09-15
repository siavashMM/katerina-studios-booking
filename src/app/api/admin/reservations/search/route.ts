import { adminService } from "@/features/booking/server";
import {
  reservationListItem,
  reservationSearchSchema,
} from "@/features/admin/contracts/reservations";
import { requireOwner } from "@/infrastructure/auth/owner";
import {
  assertMutationRequest,
  readJsonRequest,
  requireRateLimit,
} from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";
export async function POST(request: Request) {
  try {
    assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const input = reservationSearchSchema.parse(await readJsonRequest(request));
    const rows = await adminService().listReservations(owner, input);
    return Response.json(
      { rows: rows.map(reservationListItem) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return safeErrorResponse(error);
  }
}
