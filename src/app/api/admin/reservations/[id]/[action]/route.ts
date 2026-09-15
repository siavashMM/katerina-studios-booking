import { z } from "zod";
import { adminService } from "@/features/booking/server";
import { requireOwner } from "@/infrastructure/auth/owner";
import {
  assertMutationRequest,
  requireRateLimit,
  readJsonRequest,
} from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; action: string }> },
) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const { id, action } = await context.params;
    z.uuid().parse(id);
    const service = adminService();
    if (action === "confirm") {
      const body = z
        .object({ externalChannelsChecked: z.literal(true) })
        .strict()
        .parse(await readJsonRequest(request));
      await service.confirmReservation(owner, id, body);
    } else if (action === "cancel") {
      await service.cancelReservation(owner, id);
    } else if (action === "complete") {
      await service.completeReservation(owner, id);
    } else {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "This action is not available." } },
        { status: 404 },
      );
    }
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
