import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(value: string) {
  if (!/^[0-9a-f]{64}$/i.test(value))
    throw new Error("ICAL_ENCRYPTION_KEY must contain 64 hexadecimal characters.");
  return Buffer.from(value, "hex");
}

export function sealCalendarUrl(value: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function openCalendarUrl(value: string, secret: string) {
  const [version, iv, tag, encrypted] = value.split(".");
  if (version !== "v1" || !iv || !tag || !encrypted)
    throw new Error("The saved iCal URL is invalid.");
  const decipher = createDecipheriv("aes-256-gcm", key(secret), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
