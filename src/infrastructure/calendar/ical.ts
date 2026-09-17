import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import type { CalendarChannelProvider } from "./provider";
import { parseIcal } from "./parser";

function privateAddress(address: string) {
  if (
    address === "::1" ||
    address === "::" ||
    address.startsWith("fc") ||
    address.startsWith("fd") ||
    address.startsWith("fe80:")
  )
    return true;
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function safeUrl(raw: string) {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || url.port)
    throw new Error("The iCal feed URL must be a standard HTTPS URL.");
  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (!addresses.length || addresses.some((item) => privateAddress(item.address)))
    throw new Error("The iCal feed address is not permitted.");
  return url;
}

export class IcalCalendarProvider implements CalendarChannelProvider {
  async importEvents(rawUrl: string) {
    let url = await safeUrl(rawUrl);
    for (let redirect = 0; redirect <= 3; redirect += 1) {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
        headers: { Accept: "text/calendar" },
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location || redirect === 3) throw new Error("The iCal feed has too many redirects.");
        url = await safeUrl(new URL(location, url).toString());
        continue;
      }
      if (!response.ok) throw new Error("The iCal feed could not be loaded.");
      const length = Number(response.headers.get("content-length"));
      if (length > 1_000_000) throw new Error("The iCal feed is too large.");
      const body = await response.text();
      if (new TextEncoder().encode(body).byteLength > 1_000_000)
        throw new Error("The iCal feed is too large.");
      return parseIcal(body);
    }
    throw new Error("The iCal feed could not be loaded.");
  }
}
