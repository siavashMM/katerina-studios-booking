import Link from "next/link";

type Reservation = {
  id: string;
  firstName: string;
  lastName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  source: string;
  accommodationId: string;
};
type Block = {
  id: string;
  startDate: string;
  endDate: string;
  kind: string;
  reason: string | null;
  accommodationId: string;
  source?: string;
  summary?: string | null;
};

const dayMs = 86_400_000;
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const addDays = (value: string, count: number) =>
  new Date(date(value).getTime() + count * dayMs).toISOString().slice(0, 10);
const diff = (a: string, b: string) => Math.round((date(a).getTime() - date(b).getTime()) / dayMs);
const sourceLabels: Record<string, string> = {
  DIRECT: "Direct",
  MANUAL: "Manual",
  BOOKING_COM: "Booking.com",
  AIRBNB: "Airbnb",
  ICAL: "iCal",
  PHONE: "Phone",
  EMAIL: "Email",
  OTHER: "Other",
};

export function CalendarMonth({
  gridStart,
  month,
  reservations,
  blocks,
  accommodations,
}: {
  gridStart: string;
  month: string;
  reservations: Reservation[];
  blocks: Block[];
  accommodations: { id: string; name: string }[];
}) {
  const days = Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  const items = [
    ...reservations.map((item) => ({
      id: item.id,
      href: `/admin/reservations?selected=${item.id}`,
      start: item.checkIn,
      end: item.checkOut,
      title: `${item.firstName} ${item.lastName}`,
      meta: `${sourceLabels[item.source] ?? item.source} · ${item.guests} guests`,
      tone: item.status.toLowerCase(),
      accommodationId: item.accommodationId,
    })),
    ...blocks.map((item) => ({
      id: item.id,
      href: "/admin/availability",
      start: item.startDate,
      end: item.endDate,
      title: item.summary || item.reason || "Blocked",
      meta:
        item.kind === "EXTERNAL"
          ? `${sourceLabels[item.source ?? "ICAL"]} calendar`
          : "Blocked dates",
      tone: "blocked",
      accommodationId: item.accommodationId,
    })),
  ];
  const studioNames = new Map(accommodations.map((studio) => [studio.id, studio.name]));

  return (
    <>
      <div className="calendar-month" aria-label={`${month} reservation calendar`}>
        <div className="calendar-weekdays" aria-hidden="true">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        {Array.from({ length: 6 }, (_, week) => {
          const weekStart = addDays(gridStart, week * 7);
          const weekEnd = addDays(weekStart, 7);
          const visible = items.filter((item) => item.start < weekEnd && item.end > weekStart);
          return (
            <div className="calendar-week" key={weekStart}>
              <div className="calendar-day-cells">
                {days.slice(week * 7, week * 7 + 7).map((day) => (
                  <div className={day.slice(0, 7) === month ? "" : "outside-month"} key={day}>
                    <time dateTime={day}>{Number(day.slice(8, 10))}</time>
                  </div>
                ))}
              </div>
              <div className="calendar-bars">
                {visible.map((item) => {
                  const start = Math.max(0, diff(item.start, weekStart));
                  const end = Math.min(7, diff(item.end, weekStart));
                  return (
                    <Link
                      className={`calendar-bar calendar-${item.tone}`}
                      href={item.href}
                      style={{ gridColumn: `${start + 1} / span ${Math.max(1, end - start)}` }}
                      title={`${item.title}. ${item.meta}`}
                      key={`${item.id}-${weekStart}`}
                    >
                      <strong>{item.title}</strong>
                      <span>{item.meta}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="calendar-agenda">
        {items
          .sort((a, b) => a.start.localeCompare(b.start))
          .map((item) => (
            <Link href={item.href} className={`agenda-item calendar-${item.tone}`} key={item.id}>
              <time>
                {item.start} → {item.end}
              </time>
              <strong>{item.title}</strong>
              <span>
                {studioNames.get(item.accommodationId)} · {item.meta}
              </span>
            </Link>
          ))}
        {!items.length ? (
          <p className="admin-empty">No reservations or blocks in this month.</p>
        ) : null}
      </div>
    </>
  );
}
