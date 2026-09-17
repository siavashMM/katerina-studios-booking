import { adminService } from "@/features/booking/server";
import { getEnv } from "@/config/env";
import { requireOwner } from "@/infrastructure/auth/owner";
import { LocalMediaStorageProvider } from "@/infrastructure/media/provider";
import { assertMutationRequest, requireRateLimit } from "@/infrastructure/security/request";
import { RequestError, safeErrorResponse } from "@/infrastructure/security/errors";

export async function POST(request: Request) {
  let stored: { storageKey: string; publicUrl: string; width: number; height: number } | undefined;
  const provider = new LocalMediaStorageProvider();
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const env = getEnv();
    if (env.MEDIA_STORAGE !== "local" || env.NODE_ENV === "production")
      throw new RequestError("MEDIA_NOT_CONFIGURED", 503, "Photo storage is not configured.");
    const size = Number(request.headers.get("content-length"));
    if (!Number.isFinite(size) || size <= 0 || size > 8_500_000)
      throw new RequestError("BODY_TOO_LARGE", 413, "The image is too large.");
    const form = await request.formData();
    const file = form.get("file");
    const altText = form.get("altText");
    const accommodationId = form.get("accommodationId");
    if (!(file instanceof File) || typeof altText !== "string")
      throw new RequestError("VALIDATION_ERROR", 400, "Select a photo and add alt text.");
    stored = await provider.store(file);
    const media = await adminService().createMediaAsset(owner, {
      ...stored,
      altText,
      ...(typeof accommodationId === "string" && accommodationId ? { accommodationId } : {}),
    });
    return Response.json(
      { id: media.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (stored) await provider.remove(stored.storageKey).catch(() => undefined);
    return safeErrorResponse(error);
  }
}
