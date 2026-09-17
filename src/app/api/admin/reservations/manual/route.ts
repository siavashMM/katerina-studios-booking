import { adminService } from "@/features/booking/server";
import { requireOwner } from "@/infrastructure/auth/owner";
import {
  assertMutationRequest,
  readJsonRequest,
  requireRateLimit,
} from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function POST(request: Request) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const reservation = await adminService().createManualReservation(
      owner,
      await readJsonRequest(request),
    );
    return Response.json(
      { id: reservation.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return safeErrorResponse(error);
  }
}
