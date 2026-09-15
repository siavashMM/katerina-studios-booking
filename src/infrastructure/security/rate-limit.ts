import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import type { Environment } from "../../config/env";
import { getEnv } from "../../config/env";
import { RequestError } from "./errors";

export type RateLimitScope = "booking" | "login" | "availability" | "admin";
const limits: Record<RateLimitScope, { requests: number; seconds: number }> = {
  booking: { requests: 5, seconds: 600 },
  login: { requests: 10, seconds: 600 },
  availability: { requests: 90, seconds: 60 },
  admin: { requests: 60, seconds: 60 },
};

export function clientAddress(headers: Headers, trust: Environment["TRUST_PROXY"]): string {
  if (trust === "none") return "shared";
  // The trusted edge must overwrite this header and block direct origin access.
  const value = headers.get(trust === "single" ? "x-forwarded-for" : "cf-connecting-ip")?.trim();
  if (!value || value.includes(",") || !isIP(value)) {
    throw new RequestError(
      "INVALID_PROXY_ADDRESS",
      503,
      "The request could not be verified. Please try again.",
    );
  }
  if (isIP(value) === 6) {
    // Apply a common limit to IPv6 privacy addresses in the same /64 network.
    const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
    const [left, right = ""] = normalized.split("::");
    const start = left ? left.split(":") : [];
    const end = right ? right.split(":") : [];
    const groups = normalized.includes("::")
      ? [...start, ...Array<string>(8 - start.length - end.length).fill("0"), ...end]
      : start;
    return `${groups
      .slice(0, 4)
      .map((group) => Number.parseInt(group, 16).toString(16))
      .join(":")}::/64`;
  }
  return value;
}

export async function takeRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
  now = new Date(),
): Promise<boolean> {
  const { prisma } = await import("../db/client");
  const windowStart = new Date(
    Math.floor(now.getTime() / (windowSeconds * 1000)) * windowSeconds * 1000,
  );
  const expiresAt = new Date(windowStart.getTime() + windowSeconds * 1000);
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    INSERT INTO "RateLimitCounter" ("key", "windowStart", "count", "expiresAt")
    VALUES (${key}, ${windowStart}, 1, ${expiresAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitCounter"."windowStart" = EXCLUDED."windowStart" THEN "RateLimitCounter"."count" + 1 ELSE 1 END,
      "windowStart" = EXCLUDED."windowStart", "expiresAt" = EXCLUDED."expiresAt"
    RETURNING "count"
  `;
  return rows[0].count <= maxRequests;
}

export async function requireRateLimit(request: Request, scope: RateLimitScope): Promise<void> {
  const env = getEnv();
  if (!env.RATE_LIMIT_SECRET || env.RATE_LIMIT_SECRET.length < 32) {
    throw new RequestError(
      "RATE_LIMIT_NOT_CONFIGURED",
      503,
      "This service is not available. Please try again later.",
    );
  }
  const address = clientAddress(request.headers, env.TRUST_PROXY);
  const key = createHmac("sha256", env.RATE_LIMIT_SECRET)
    .update(`${scope}:${address}`)
    .digest("hex");
  const limit = limits[scope];
  if (!(await takeRateLimit(`${scope}:${key}`, limit.requests, limit.seconds))) {
    throw new RequestError("RATE_LIMITED", 429, "Too many requests. Wait before you try again.");
  }
}
