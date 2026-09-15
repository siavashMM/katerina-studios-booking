import { bookingService } from "@/features/booking/server";
import { requireRateLimit } from "@/infrastructure/security/request";
import { safeErrorResponse } from "@/infrastructure/security/errors";

export async function GET(request: Request) {
  try {
    await requireRateLimit(request, "availability");
    const params = new URL(request.url).searchParams;
    const result = await bookingService().getAvailability({
      checkIn: params.get("checkIn") ?? "",
      checkOut: params.get("checkOut") ?? "",
      guests: Number(params.get("guests")),
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
