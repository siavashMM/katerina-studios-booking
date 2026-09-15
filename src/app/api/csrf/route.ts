import { NextResponse } from "next/server";
import { issueCsrfToken } from "@/infrastructure/security/request";

export async function GET() {
  const response = NextResponse.json({});
  const csrfToken = issueCsrfToken(response);
  const result = NextResponse.json({ csrfToken }, { headers: { "Cache-Control": "no-store" } });
  for (const cookie of response.cookies.getAll()) result.cookies.set(cookie);
  return result;
}
