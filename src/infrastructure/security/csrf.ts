import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { RequestError } from "./errors";

export const CSRF_MAX_AGE_SECONDS = 2 * 60 * 60;

function digest(value: string, secret: string): string {
  return createHmac("sha256", secret).update(`csrf:${value}`).digest("base64url");
}

export function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function createCsrfToken(secret: string, now = Date.now()): string {
  const value = `${Math.floor(now / 1000)}.${randomBytes(32).toString("base64url")}`;
  return `${value}.${digest(value, secret)}`;
}

export function verifyCsrfToken(token: string, secret: string, now = Date.now()): boolean {
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{43})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const age = Math.floor(now / 1000) - Number(match[1]);
  return (
    age >= 0 &&
    age <= CSRF_MAX_AGE_SECONDS &&
    constantTimeEqual(match[3], digest(`${match[1]}.${match[2]}`, secret))
  );
}

export function assertSameOrigin(headers: Headers, appUrl: string): void {
  const origin = headers.get("origin");
  if (origin !== new URL(appUrl).origin || headers.get("sec-fetch-site") === "cross-site") {
    throw new RequestError("INVALID_ORIGIN", 403, "Reload the page and try again.");
  }
}
