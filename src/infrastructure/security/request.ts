import { NextResponse } from "next/server";
import { getEnv, readinessIssues } from "../../config/env";
import {
  assertSameOrigin,
  constantTimeEqual,
  createCsrfToken,
  CSRF_MAX_AGE_SECONDS,
  verifyCsrfToken,
} from "./csrf";
import { RequestError } from "./errors";
export { requireRateLimit } from "./rate-limit";

export function csrfCookieName(): string {
  return getEnv().APP_URL.startsWith("https://") ? "__Host-ks_csrf" : "ks_csrf";
}

function csrfSecret(): string {
  const secret = getEnv().RATE_LIMIT_SECRET;
  if (!secret || secret.length < 32)
    throw new RequestError(
      "CSRF_NOT_CONFIGURED",
      503,
      "This service is not available. Please try again later.",
    );
  return secret;
}

export function issueCsrfToken(response: NextResponse): string {
  const token = createCsrfToken(csrfSecret());
  response.cookies.set(csrfCookieName(), token, {
    httpOnly: false,
    secure: getEnv().APP_URL.startsWith("https://"),
    sameSite: "strict",
    path: "/",
    maxAge: CSRF_MAX_AGE_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return token;
}

export function assertMutationRequest(request: Request): void {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method))
    throw new RequestError("METHOD_NOT_ALLOWED", 405, "Use a valid request method.");
  assertSameOrigin(request.headers, getEnv().APP_URL);
  const name = csrfCookieName();
  const cookieTokens = (request.headers.get("cookie") ?? "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${name}=`));
  const cookieToken = cookieTokens.length === 1 ? cookieTokens[0].slice(name.length + 1) : "";
  const headerToken = request.headers.get("x-csrf-token") ?? "";
  if (
    !cookieToken ||
    !constantTimeEqual(cookieToken, headerToken) ||
    !verifyCsrfToken(headerToken, csrfSecret())
  ) {
    throw new RequestError("INVALID_CSRF_TOKEN", 403, "Reload the page and try again.");
  }
}

export function assertBookingServiceReady(): void {
  if (readinessIssues().length > 0)
    throw new RequestError(
      "BOOKING_DISABLED",
      503,
      "Online booking requests are not available. Please contact the property.",
    );
}

export async function readBodyLimited(request: Request, maximumBytes = 16_384): Promise<string> {
  const advertised = Number(request.headers.get("content-length"));
  if (advertised > maximumBytes)
    throw new RequestError("BODY_TOO_LARGE", 413, "The request is too large.");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximumBytes) {
        await reader.cancel();
        throw new RequestError("BODY_TOO_LARGE", 413, "The request is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function readJsonRequest(request: Request): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json")
    throw new RequestError("INVALID_CONTENT_TYPE", 415, "Send the request as JSON.");
  const body = await readBodyLimited(request);
  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new RequestError("INVALID_JSON", 400, "Check the request and try again.");
  }
}
