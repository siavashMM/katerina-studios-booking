type LogFields = {
  event: string;
  code?: string;
  requestId?: string;
  reservationId?: string;
  messageId?: string;
  actorId?: string;
  count?: number;
};

export function logEvent(level: "info" | "warn" | "error", fields: LogFields): void {
  // Accept only operational fields. Never pass raw errors or request objects.
  const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, ...fields });
  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else console.info(entry);
}
