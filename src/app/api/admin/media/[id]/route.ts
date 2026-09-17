import { z } from "zod";
import { adminService } from "@/features/booking/server";
import { getEnv } from "@/config/env";
import { requireOwner } from "@/infrastructure/auth/owner";
import { LocalMediaStorageProvider } from "@/infrastructure/media/provider";
import {
  assertMutationRequest,
  readJsonRequest,
  requireRateLimit,
} from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const id = z.uuid().parse((await context.params).id);
    const media = await adminService().updateMediaAsset(owner, id, await readJsonRequest(request));
    return Response.json({ id: media.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const id = z.uuid().parse((await context.params).id);
    const media = await adminService().deleteMediaAsset(owner, id);
    if (getEnv().MEDIA_STORAGE === "local")
      await new LocalMediaStorageProvider().remove(media.storageKey);
    return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
