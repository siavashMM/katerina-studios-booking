import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import type { SessionData } from "@auth0/nextjs-auth0/types";
import { prisma } from "../../src/infrastructure/db/client";
import { PostgresSessionStore } from "../../src/infrastructure/auth/session-store";
import { takeRateLimit } from "../../src/infrastructure/security/rate-limit";

const ids: string[] = [];
function newSession(): SessionData {
  return {
    user: { sub: "auth0|test-owner", iss: "https://tenant.example/", amr: ["mfa"] },
    tokenSet: { accessToken: "test-only-token", expiresAt: Math.floor(Date.now() / 1000) + 60 },
    internal: { sid: randomUUID(), createdAt: Math.floor(Date.now() / 1000) },
  };
}
function id(): string {
  const value = `security-test-${randomUUID()}`;
  ids.push(value);
  return value;
}

afterAll(async () => {
  await prisma.authSession.deleteMany({ where: { id: { in: ids } } });
  await prisma.rateLimitCounter.deleteMany({ where: { key: { in: ids } } });
});

describe("PostgreSQL security controls", () => {
  it("stores sessions and invalidates them on logout", async () => {
    const store = new PostgresSessionStore();
    const key = id();
    const session = newSession();
    await store.set(key, session);
    expect((await store.get(key))?.user.sub).toBe(session.user.sub);
    await store.delete(key);
    expect(await store.get(key)).toBeNull();
  });
  it("never recreates a session after a concurrent logout", async () => {
    const store = new PostgresSessionStore();
    const key = id();
    const session = newSession();
    await store.set(key, session);
    const inFlight = await store.get(key);
    await store.delete(key);
    expect(await store.update(key, inFlight!)).toBe(false);
    expect(await prisma.authSession.findUnique({ where: { id: key } })).toBeNull();
  });
  it("rejects expired sessions and does not roll them", async () => {
    const store = new PostgresSessionStore();
    const key = id();
    const session = newSession();
    await store.set(key, session);
    await prisma.authSession.update({ where: { id: key }, data: { expiresAt: new Date(0) } });
    expect(await store.get(key)).toBeNull();
    expect(await store.update(key, session)).toBe(false);
  });
  it("does not extend an absolute session lifetime", async () => {
    const now = new Date();
    const store = new PostgresSessionStore(() => now);
    const key = id();
    const session = newSession();
    session.internal.createdAt = Math.floor(now.getTime() / 1000) - (8 * 3600 - 10);
    await store.set(key, session);
    const record = await prisma.authSession.findUniqueOrThrow({ where: { id: key } });
    expect(record.expiresAt.getTime() - now.getTime()).toBeLessThanOrEqual(10_000);
  });
  it("counts concurrent requests atomically across clients", async () => {
    const key = id();
    const now = new Date();
    const results = await Promise.all(
      Array.from({ length: 12 }, () => takeRateLimit(key, 5, 60, now)),
    );
    expect(results.filter(Boolean)).toHaveLength(5);
    expect((await prisma.rateLimitCounter.findUniqueOrThrow({ where: { key } })).count).toBe(12);
  });
});
