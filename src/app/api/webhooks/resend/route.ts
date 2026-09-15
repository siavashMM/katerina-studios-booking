import { Resend } from "resend";
import { getEnv } from "@/config/env";
import { readBodyLimited } from "@/infrastructure/security/request";
import { RequestError, safeErrorResponse } from "@/infrastructure/security/errors";
import { recordDeliveryEvent } from "@/infrastructure/email/webhook";

export async function POST(request: Request) {
  try {
    const env = getEnv();
    if (!env.RESEND_WEBHOOK_SECRET)
      throw new RequestError("WEBHOOK_DISABLED", 503, "This service is not available.");
    const payload = await readBodyLimited(request, 65536);
    const id = request.headers.get("svix-id") ?? "";
    let event;
    try {
      event = new Resend(env.RESEND_API_KEY ?? "verify-only").webhooks.verify({
        payload,
        webhookSecret: env.RESEND_WEBHOOK_SECRET,
        headers: {
          id,
          timestamp: request.headers.get("svix-timestamp") ?? "",
          signature: request.headers.get("svix-signature") ?? "",
        },
      });
    } catch {
      throw new RequestError("INVALID_SIGNATURE", 401, "Access is not permitted.");
    }
    const providerId =
      "email_id" in event.data && typeof event.data.email_id === "string"
        ? event.data.email_id
        : undefined;
    await recordDeliveryEvent(id, event.type, providerId);
    return Response.json({ received: true });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
