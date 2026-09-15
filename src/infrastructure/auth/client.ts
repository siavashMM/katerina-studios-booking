import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { NextResponse } from "next/server";
import { authConfigured, authIssuer, getEnv } from "@/config/env";
import { prisma } from "../db/client";
import { ownerClaims } from "./claims";
import { PostgresSessionStore } from "./session-store";
import { RequestError } from "../security/errors";
import { logEvent } from "../logging/logger";

export function getAuthClient() {
  const env = getEnv();
  if (!authConfigured(env))
    throw new RequestError("AUTH_NOT_CONFIGURED", 503, "Owner login is not configured.");
  return new Auth0Client({
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
    secret: env.AUTH0_SECRET,
    appBaseUrl: env.APP_URL,
    enableAccessTokenEndpoint: false,
    allowInsecureRequests: env.NODE_ENV === "test" && env.AUTH0_TEST_INSECURE,
    sessionStore: new PostgresSessionStore(),
    session: {
      absoluteDuration: 8 * 3600,
      inactivityDuration: 30 * 60,
      rolling: true,
      cookie: { secure: env.APP_URL.startsWith("https:"), sameSite: "lax" },
    },
    authorizationParameters: {
      scope: "openid profile email",
      acr_values: "http://schemas.openid.net/pape/policies/2007/06/multi-factor",
    },
    beforeSessionSaved: async (session, idToken) => {
      // The SDK verifies this token before this hook runs. Preserve required claims.
      const claims: unknown = idToken
        ? JSON.parse(Buffer.from(idToken.split(".")[1], "base64url").toString("utf8"))
        : session.user;
      const identity = ownerClaims(claims, authIssuer(env), env.AUTH0_MFA_CLAIM);
      const membership = await prisma.ownerMembership.findFirst({
        where: {
          issuer: identity.issuer,
          authSubject: identity.subject,
          active: true,
          property: { slug: "katerina-studios" },
        },
      });
      if (!membership) throw new RequestError("FORBIDDEN", 403, "Owner access is not permitted.");
      return { ...session, user: { sub: identity.subject, iss: identity.issuer, amr: ["mfa"] } };
    },
    onCallback: async (error, context) => {
      if (error) {
        logEvent("warn", { event: "owner_login_failed", code: "AUTH_FAILED" });
        return NextResponse.redirect(new URL("/admin/login?error=login", env.APP_URL));
      }
      const returnTo =
        context.returnTo?.startsWith("/admin/") && !context.returnTo.startsWith("//")
          ? context.returnTo
          : "/admin/reservations";
      return NextResponse.redirect(new URL(returnTo, env.APP_URL));
    },
  });
}
