import { z } from "zod";
import { getEnv } from "@/config/env";
import { adminService } from "@/features/booking/server";
import { requireOwner } from "@/infrastructure/auth/owner";
import { sealCalendarUrl } from "@/infrastructure/calendar/secrets";
import {
  assertMutationRequest,
  readJsonRequest,
  requireRateLimit,
} from "@/infrastructure/security/request";
import { RequestError, safeErrorResponse } from "@/infrastructure/security/errors";

const schema = z
  .object({
    accommodationId: z.uuid(),
    name: z.string().trim().min(1).max(100),
    url: z.url().max(3000),
  })
  .strict();

export async function POST(request: Request) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const secret = getEnv().ICAL_ENCRYPTION_KEY;
    if (!secret)
      throw new RequestError("ICAL_NOT_CONFIGURED", 503, "iCal encryption is not configured.");
    const input = schema.parse(await readJsonRequest(request));
    const url = new URL(input.url);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      throw new RequestError("VALIDATION_ERROR", 400, "Use a standard HTTPS iCal URL.");
    const calendar = await adminService().createExternalCalendar(owner, {
      accommodationId: input.accommodationId,
      name: input.name,
      encryptedUrl: sealCalendarUrl(url.toString(), secret),
    });
    return Response.json(
      { id: calendar.id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return safeErrorResponse(error);
  }
}
