import { describe, expect, it } from "vitest";
import { googleReviewsConfigured, parseEnv, readinessIssues } from "../../config/env";
import { createCsrfToken, verifyCsrfToken, assertSameOrigin } from "../security/csrf";
import { clientAddress } from "../security/rate-limit";
import { ownerClaims } from "../auth/claims";
import { contentSecurityPolicy } from "../security/headers";

describe("security boundaries", () => {
  it("uses safe demo defaults and does not coerce false to true", () => {
    expect(parseEnv({}).DEMO_MODE).toBe(true);
    expect(parseEnv({ DEMO_MODE: "false" }).DEMO_MODE).toBe(false);
    expect(() => parseEnv({ BOOKING_MODE: "instant" })).toThrow();
  });
  it("reports missing production controls without returning secrets", () => {
    const issues = readinessIssues(parseEnv({ DEMO_MODE: "false" }));
    expect(issues).toContain("APP_URL_HTTPS_REQUIRED");
    expect(issues).toContain("AUTH_NOT_CONFIGURED");
    expect(issues).toContain("PROPERTY_DATA_NOT_VERIFIED");
  });
  it("validates Google reviews as one server-side configuration", () => {
    expect(
      googleReviewsConfigured(
        parseEnv({
          GOOGLE_PLACES_API_KEY: "server-key",
          GOOGLE_PLACE_ID: "ChIJ_example-place",
        }),
      ),
    ).toBe(true);
    expect(() => parseEnv({ GOOGLE_PLACES_API_KEY: "server-key" })).toThrow(
      "GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID",
    );
    expect(() => parseEnv({ GOOGLE_PLACE_ID: "invalid/place" })).toThrow();
    expect(() => parseEnv({ GOOGLE_MAPS_URL: "https://example.test/place" })).toThrow(
      "GOOGLE_MAPS_URL",
    );
  });
  it("rejects a forged or expired CSRF token", () => {
    const secret = "s".repeat(64);
    const token = createCsrfToken(secret, 1_000);
    expect(verifyCsrfToken(token, secret, 2_000)).toBe(true);
    expect(verifyCsrfToken(`${token}x`, secret, 2_000)).toBe(false);
    expect(verifyCsrfToken(token, "other", 2_000)).toBe(false);
    expect(verifyCsrfToken(token, secret, 10_000_000)).toBe(false);
  });
  it("requires the exact origin and rejects cross-site requests", () => {
    expect(() =>
      assertSameOrigin(new Headers({ origin: "https://stay.example" }), "https://stay.example"),
    ).not.toThrow();
    for (const headers of [
      new Headers(),
      new Headers({ origin: "https://stay.example.evil.test" }),
      new Headers({ origin: "https://stay.example", "sec-fetch-site": "cross-site" }),
    ]) {
      expect(() => assertSameOrigin(headers, "https://stay.example")).toThrow();
    }
  });
  it("ignores spoofed forwarding headers without explicit proxy trust", () => {
    const headers = new Headers({
      "x-forwarded-for": "192.0.2.1",
      "cf-connecting-ip": "192.0.2.2",
    });
    expect(clientAddress(headers, "none")).toBe("shared");
    expect(clientAddress(headers, "single")).toBe("192.0.2.1");
    expect(clientAddress(headers, "cloudflare")).toBe("192.0.2.2");
    headers.set("x-forwarded-for", "192.0.2.1, 192.0.2.3");
    expect(() => clientAddress(headers, "single")).toThrow();
  });
  it("requires a valid issuer, subject, and current MFA proof", () => {
    const issuer = "https://tenant.auth0.com/";
    const claim = "https://stay.example/mfa";
    expect(
      ownerClaims({ sub: "auth0|owner", iss: issuer, amr: ["pwd", "mfa"] }, issuer, claim).subject,
    ).toBe("auth0|owner");
    expect(
      ownerClaims({ sub: "auth0|owner", iss: issuer, [claim]: true }, issuer, claim).subject,
    ).toBe("auth0|owner");
    for (const user of [
      { sub: "auth0|owner", iss: issuer },
      { sub: "auth0|owner", iss: issuer, enrolledMfa: true },
      { sub: "auth0|owner", iss: "https://other/", amr: ["mfa"] },
    ]) {
      expect(() => ownerClaims(user, issuer, claim)).toThrow();
    }
  });
  it("uses a nonce and keeps production scripts strict", () => {
    const csp = contentSecurityPolicy("noncevalue", false);
    expect(csp).toContain("'nonce-noncevalue'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("frame-src 'self' https://www.google.com");
    expect(csp).toContain("https://*.googleusercontent.com");
    expect(csp).not.toContain("tile.openstreetmap.org");
    expect(csp.split(";").find((part) => part.trim().startsWith("script-src"))).not.toContain(
      "unsafe-inline",
    );
    expect(csp).not.toContain("unsafe-eval");
  });
});
