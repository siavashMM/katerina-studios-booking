import { z } from "zod";
import { prisma } from "@/infrastructure/db/client";
import { getEnv } from "@/config/env";
import { adminService } from "@/features/booking/server";
import { requireOwner } from "@/infrastructure/auth/owner";
import { IcalCalendarProvider } from "@/infrastructure/calendar/ical";
import { openCalendarUrl } from "@/infrastructure/calendar/secrets";
import { assertMutationRequest, requireRateLimit } from "@/infrastructure/security/request";
import { RequestError, safeErrorResponse } from "@/infrastructure/security/errors";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await assertMutationRequest(request);
    const owner = await requireOwner();
    await requireRateLimit(request, "admin");
    const id = z.uuid().parse((await context.params).id);
    const secret = getEnv().ICAL_ENCRYPTION_KEY;
    if (!secret)
      throw new RequestError("ICAL_NOT_CONFIGURED", 503, "iCal encryption is not configured.");
    const calendar = await prisma.externalCalendar.findFirst({
      where: { id, propertyId: owner.propertyId, active: true },
      select: { encryptedUrl: true },
    });
    if (!calendar) throw new RequestError("NOT_FOUND", 404, "The iCal calendar was not found.");
    const events = await new IcalCalendarProvider().importEvents(
      openCalendarUrl(calendar.encryptedUrl, secret),
    );
    const result = await adminService().syncExternalCalendar(owner, id, events);
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
