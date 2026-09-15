import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { authConfigured, getEnv } from "@/config/env";
import { getAuthClient } from "@/infrastructure/auth/client";
import { contentSecurityPolicy, setSecurityHeaders } from "@/infrastructure/security/headers";
import { requireRateLimit } from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function proxy(request: NextRequest) {
  const env = getEnv();
  const nonce = randomBytes(24).toString("base64");
  const csp = contentSecurityPolicy(
    nonce,
    env.NODE_ENV !== "production",
    env.APP_URL.startsWith("https:"),
  );
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const forwarded = new NextRequest(request, { headers });
  let response: NextResponse;
  try {
    if (request.nextUrl.pathname === "/auth/login") await requireRateLimit(request, "login");
    if (authConfigured(env)) {
      const authResponse = await getAuthClient().middleware(forwarded);
      if (authResponse.headers.has("location") || !authResponse.headers.has("x-middleware-next"))
        response = authResponse;
      else {
        for (const cookie of authResponse.cookies.getAll())
          forwarded.cookies.set(cookie.name, cookie.value);
        response = NextResponse.next({ request: { headers: forwarded.headers } });
        for (const [name, value] of authResponse.headers) {
          if (!name.startsWith("x-middleware") && name !== "set-cookie")
            response.headers.set(name, value);
        }
        for (const cookie of authResponse.cookies.getAll()) response.cookies.set(cookie);
      }
    } else if (request.nextUrl.pathname.startsWith("/auth/"))
      response = NextResponse.redirect(new URL("/admin/login", env.APP_URL));
    else response = NextResponse.next({ request: { headers } });
  } catch (error) {
    response = safeErrorResponse(error);
  }
  setSecurityHeaders(response.headers, csp, env.APP_URL.startsWith("https:"), env.DEMO_MODE);
  if (/^\/(admin|booking|api|auth)(\/|$)/.test(request.nextUrl.pathname))
    response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|images/|fonts/|favicon.ico).*)"] };
