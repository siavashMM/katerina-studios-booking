import { NextResponse } from "next/server";
import { bookingService } from "@/features/booking/server";
import { getEnv } from "@/config/env";
import {
  assertMutationRequest,
  requireRateLimit,
  readJsonRequest,
} from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function POST(request: Request) {
  try {
    await assertMutationRequest(request);
    await requireRateLimit(request, "booking");
    const input = await readJsonRequest(request);
    const result = await bookingService().createRequest(input);
    const response = NextResponse.json(
      { receipt: result.receipt },
      {
        status: result.replayed ? 200 : 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
    response.cookies.set("ks_receipt", `${result.receipt.reference}.${result.receiptToken}`, {
      httpOnly: true,
      secure: getEnv().APP_URL.startsWith("https:"),
      sameSite: "lax",
      path: "/booking",
      maxAge: 3600,
    });
    return response;
  } catch (error) {
    return safeErrorResponse(error);
  }
}
