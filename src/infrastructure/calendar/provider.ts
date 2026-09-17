export type CalendarChannelEvent = {
  externalId: string;
  start: string;
  end: string;
  summary?: string;
  cancelled: boolean;
};

export interface CalendarChannelProvider {
  importEvents(url: string): Promise<CalendarChannelEvent[]>;
}
