import { z } from "zod";
import { adminService } from "@/features/booking/server";
import { requireOwner } from "@/infrastructure/auth/owner";
import { assertMutationRequest, requireRateLimit } from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const id = z.uuid().parse((await context.params).id);
    await adminService().releaseBlock(owner, id);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
