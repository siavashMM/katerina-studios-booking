import { NextResponse } from "next/server";
import { logEvent } from "../logging/logger";

export class RequestError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

const domainErrors: Record<string, { status: number; message: string }> = {
  FORBIDDEN: { status: 403, message: "Access is not permitted." },
  VALIDATION_ERROR: { status: 400, message: "Check the information and try again." },
  UNAVAILABLE: { status: 409, message: "These dates are no longer available. Select other dates." },
  QUOTE_CHANGED: {
    status: 409,
    message: "The price changed. Review the new price before you continue.",
  },
  IDEMPOTENCY_CONFLICT: {
    status: 409,
    message: "This request changed. Review the details and submit a new request.",
  },
  NOT_FOUND: { status: 404, message: "This record is not available." },
  BOOKING_DISABLED: {
    status: 503,
    message: "Online booking requests are not available. Please contact the property.",
  },
  INVALID_TRANSITION: { status: 409, message: "The reservation status changed. Reload this page." },
  EXTERNAL_CHANNELS_REQUIRED: {
    status: 400,
    message: "Check the external calendars before you confirm this reservation.",
  },
};

export function safeErrorResponse(error: unknown): NextResponse {
  let code = "INTERNAL_ERROR";
  let status = 500;
  let message = "The request could not be completed. Please try again.";
  if (error instanceof RequestError) {
    ({ code, status, message } = error);
  } else if (error instanceof Error && error.name === "ZodError") {
    code = "VALIDATION_ERROR";
    ({ status, message } = domainErrors.VALIDATION_ERROR);
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    domainErrors[error.code]
  ) {
    code = error.code;
    ({ status, message } = domainErrors[code]);
  }
  if (status >= 500) logEvent("error", { event: "request_failed", code });
  const response = NextResponse.json({ error: { code, message } }, { status });
  response.headers.set("Cache-Control", "no-store");
  if (status === 429) response.headers.set("Retry-After", "60");
  return response;
}
