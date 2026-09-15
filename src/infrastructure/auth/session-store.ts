import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import type { SessionData, SessionDataStore } from "@auth0/nextjs-auth0/types";
import { z } from "zod";
import { prisma } from "../db/client";
import { getEnv } from "@/config/env";

const sessionSchema = z
  .object({
    user: z.object({ sub: z.string() }).catchall(z.unknown()),
    tokenSet: z.object({ accessToken: z.string(), expiresAt: z.number() }).catchall(z.unknown()),
    internal: z.object({ sid: z.string(), createdAt: z.number() }).catchall(z.unknown()),
  })
  .catchall(z.unknown());
const sealedSchema = z.object({ iv: z.string(), tag: z.string(), sealed: z.string() });
function key() {
  const secret = getEnv().AUTH0_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret))
    throw new Error("The session encryption key is not configured.");
  return Buffer.from(secret, "hex");
}
function seal(session: SessionData) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(session), "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    sealed: data.toString("base64"),
  };
}
function open(data: unknown): SessionData | null {
  try {
    const value = sealedSchema.parse(data);
    const cipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(value.iv, "base64"));
    cipher.setAuthTag(Buffer.from(value.tag, "base64"));
    const decoded = Buffer.concat([
      cipher.update(Buffer.from(value.sealed, "base64")),
      cipher.final(),
    ]).toString("utf8");
    return sessionSchema.parse(JSON.parse(decoded)) as SessionData;
  } catch {
    return null;
  }
}

export class PostgresSessionStore implements SessionDataStore {
  constructor(private readonly now: () => Date = () => new Date()) {}
  private expiry(session: SessionData) {
    return new Date(
      Math.min(
        this.now().getTime() + 30 * 60 * 1000,
        (session.internal.createdAt + 8 * 3600) * 1000,
      ),
    );
  }
  async get(id: string): Promise<SessionData | null> {
    const row = await prisma.authSession.findUnique({ where: { id } });
    if (!row || row.expiresAt <= this.now()) return null;
    const session = open(row.data);
    if (!session || this.expiry(session) <= this.now()) return null;
    return session;
  }
  async set(id: string, session: SessionData) {
    const expiresAt = this.expiry(session);
    if (expiresAt <= this.now()) return;
    const data = seal(session);
    await prisma.authSession.upsert({
      where: { id },
      create: { id, data, expiresAt },
      update: { data, expiresAt },
    });
  }
  async update(id: string, session: SessionData): Promise<boolean> {
    const expiresAt = this.expiry(session);
    if (expiresAt <= this.now()) return false;
    const result = await prisma.authSession.updateMany({
      where: { id, expiresAt: { gt: this.now() } },
      data: { data: seal(session), expiresAt },
    });
    return result.count === 1;
  }
  async delete(id: string) {
    await prisma.authSession.deleteMany({ where: { id } });
  }
}
