import { adminService } from "@/features/booking/server";
import { requireOwner } from "@/infrastructure/auth/owner";
import {
  assertMutationRequest,
  readJsonRequest,
  requireRateLimit,
} from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function PUT(request: Request) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const content = await adminService().updatePropertyContent(
      owner,
      await readJsonRequest(request),
    );
    return Response.json({ id: content.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
