import Link from "next/link";
import { z } from "zod";
import { ownerForPage } from "@/features/admin/page-auth";
import { adminService } from "@/features/booking/server";
import { dateOnly } from "@/features/booking/domain/rules";
import { AdminNav } from "@/features/admin/ui/admin-nav";
import { CalendarMonth } from "@/features/admin/ui/calendar-month";
import { ManualBooking } from "@/features/admin/ui/manual-booking";

const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const dayMs = 86_400_000;
function calendarRange(month: string) {
  const first = new Date(`${month}-01T00:00:00.000Z`);
  const mondayOffset = (first.getUTCDay() + 6) % 7;
  const start = new Date(first.getTime() - mondayOffset * dayMs);
  const end = new Date(start.getTime() + 42 * dayMs);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}
function moveMonth(month: string, amount: number) {
  const value = new Date(`${month}-01T00:00:00.000Z`);
  value.setUTCMonth(value.getUTCMonth() + amount);
  return value.toISOString().slice(0, 7);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const owner = await ownerForPage();
  const query = await searchParams;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const month = monthSchema.safeParse(query.month).success ? query.month! : currentMonth;
  const range = calendarRange(month);
  const service = adminService();
  const [{ reservations, blocks, accommodations }, studios, context] = await Promise.all([
    service.listCalendar(owner, range),
    service.listAccommodationsForOwner(owner),
    service.getPortalContext(owner),
  ]);
  const label = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
  return (
    <>
      <AdminNav fullControl={context.property.portalPlan === "FULL_CONTROL"} />
      <main id="main-content" className="admin-main admin-main-workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Availability</p>
            <h1>Calendar</h1>
          </div>
          <div className="header-actions">
            <ManualBooking studios={studios} />
            <Link className="button button-small button-secondary" href="/admin/availability">
              Block dates
            </Link>
          </div>
        </header>
        <div className="calendar-toolbar">
          <h2>{label}</h2>
          <div>
            <Link
              className="icon-button"
              aria-label="Previous month"
              href={`/admin/calendar?month=${moveMonth(month, -1)}`}
            >
              ←
            </Link>
            <Link
              className="button button-small button-secondary"
              href={`/admin/calendar?month=${currentMonth}`}
            >
              Today
            </Link>
            <Link
              className="icon-button"
              aria-label="Next month"
              href={`/admin/calendar?month=${moveMonth(month, 1)}`}
            >
              →
            </Link>
          </div>
        </div>
        <div className="calendar-legend">
          <span>
            <i className="legend-confirmed" />
            Confirmed
          </span>
          <span>
            <i className="legend-pending" />
            Pending
          </span>
          <span>
            <i className="legend-blocked" />
            Blocked
          </span>
        </div>
        <CalendarMonth
          gridStart={range.start}
          month={month}
          accommodations={accommodations}
          reservations={reservations.map((item) => ({
            ...item,
            checkIn: dateOnly(item.checkIn),
            checkOut: dateOnly(item.checkOut),
          }))}
          blocks={blocks.map((item) => ({
            id: item.id,
            accommodationId: item.accommodationId,
            startDate: dateOnly(item.startDate),
            endDate: dateOnly(item.endDate),
            kind: item.kind,
            reason: item.reason,
            source: item.externalEvent?.source,
            summary: item.externalEvent?.summary,
          }))}
        />
      </main>
    </>
  );
}
