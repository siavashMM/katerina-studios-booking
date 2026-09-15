"use client";

import { useSyncExternalStore } from "react";
import { parseDate, type CalendarDate } from "@internationalized/date";
import {
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateRangePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  I18nProvider,
  Label,
  Popover,
  RangeCalendar,
} from "react-aria-components";
import { useTranslation } from "@/i18n/client";

const desktopQuery = "(min-width: 1024px)";
function subscribe(callback: () => void) {
  const query = window.matchMedia(desktopQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
function parseRange(checkIn: string, checkOut: string) {
  try {
    const start = parseDate(checkIn);
    const end = parseDate(checkOut);
    return start.compare(end) < 0 ? { start, end } : null;
  } catch {
    return null;
  }
}

export function StayPicker({
  checkIn,
  checkOut,
  onChange,
  today,
}: {
  checkIn: string;
  checkOut: string;
  today: string;
  onChange: (start: string, end: string) => void;
}) {
  const { intlLocale, Translate } = useTranslation();
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(desktopQuery).matches,
    () => false,
  );
  const grids = desktop ? [0, 1] : [0];
  return (
    <I18nProvider locale={intlLocale}>
      <DateRangePicker
        className="stay-picker"
        value={parseRange(checkIn, checkOut)}
        minValue={parseDate(today)}
        maxValue={parseDate(today).add({ days: 365 })}
        granularity="day"
        isRequired
        onChange={(value: { start: CalendarDate; end: CalendarDate } | null) => {
          if (value) onChange(value.start.toString(), value.end.toString());
        }}
      >
        <Label>{Translate.booking.calendar.label}</Label>
        <Group className="stay-date-fields">
          <div>
            <span className="date-caption">{Translate.booking.calendar.checkIn}</span>
            <DateInput slot="start">{(segment) => <DateSegment segment={segment} />}</DateInput>
          </div>
          <span aria-hidden="true" className="date-arrow">
            →
          </span>
          <div>
            <span className="date-caption">{Translate.booking.calendar.checkOut}</span>
            <DateInput slot="end">{(segment) => <DateSegment segment={segment} />}</DateInput>
          </div>
          <Button className="calendar-open" aria-label={Translate.booking.calendar.open}>
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M7 2v6M17 2v6M3 11h18" />
            </svg>
          </Button>
        </Group>
        <Popover className="calendar-popover" placement="bottom start">
          <Dialog aria-label={Translate.booking.calendar.dialog}>
            <RangeCalendar visibleDuration={{ months: desktop ? 2 : 1 }} firstDayOfWeek="mon">
              <header className="calendar-header">
                <Button slot="previous" aria-label={Translate.booking.calendar.previous}>
                  ←
                </Button>
                <Heading />
                <Button slot="next" aria-label={Translate.booking.calendar.next}>
                  →
                </Button>
              </header>
              <div className="calendar-months">
                {grids.map((offset) => (
                  <CalendarGrid key={offset} offset={{ months: offset }}>
                    <CalendarGridHeader>
                      {(day) => <CalendarHeaderCell>{day}</CalendarHeaderCell>}
                    </CalendarGridHeader>
                    <CalendarGridBody>{(date) => <CalendarCell date={date} />}</CalendarGridBody>
                  </CalendarGrid>
                ))}
              </div>
            </RangeCalendar>
            <p className="calendar-note">{Translate.booking.calendar.note}</p>
          </Dialog>
        </Popover>
      </DateRangePicker>
    </I18nProvider>
  );
}
