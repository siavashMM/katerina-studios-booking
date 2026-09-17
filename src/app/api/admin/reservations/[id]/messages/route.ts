import { z } from "zod";
import { adminService } from "@/features/booking/server";
import { requireOwner } from "@/infrastructure/auth/owner";
import {
  assertMutationRequest,
  readJsonRequest,
  requireRateLimit,
} from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const id = z.uuid().parse((await context.params).id);
    const email = await adminService().sendGuestMessage(owner, id, await readJsonRequest(request));
    return Response.json(
      { id: email.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return safeErrorResponse(error);
  }
}
