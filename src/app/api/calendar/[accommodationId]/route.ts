import { z } from "zod";
import { getEnv } from "@/config/env";
import { dateOnly } from "@/features/booking/domain/rules";
import { prisma } from "@/infrastructure/db/client";
import { renderAvailabilityCalendar, verifyCalendarToken } from "@/infrastructure/calendar/export";

export async function GET(
  request: Request,
  context: { params: Promise<{ accommodationId: string }> },
) {
  const id = z.uuid().safeParse((await context.params).accommodationId);
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const secret = getEnv().ICAL_EXPORT_SECRET;
  if (!id.success || !secret || !verifyCalendarToken(id.data, token, secret))
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const accommodation = await prisma.accommodation.findFirst({
    where: { id: id.data, active: true, property: { slug: "katerina-studios" } },
    select: {
      name: true,
      allocations: {
        where: { active: true },
        select: { id: true, startDate: true, endDate: true },
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!accommodation)
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  const calendar = renderAvailabilityCalendar(
    accommodation.name,
    accommodation.allocations.map((item) => ({
      id: item.id,
      start: dateOnly(item.startDate),
      end: dateOnly(item.endDate),
    })),
  );
  return new Response(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="katerina-${id.data}.ics"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
