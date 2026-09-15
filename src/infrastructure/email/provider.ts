import { z } from "zod";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey: string;
}
export interface EmailProvider {
  send(message: EmailMessage): Promise<{ id: string; captured: boolean }>;
}
export class DeliveryError extends Error {
  constructor(
    public code: string,
    public permanent: boolean,
  ) {
    super(code);
  }
}
export class ResendEmailProvider implements EmailProvider {
  constructor(private options: { demo: boolean; key?: string; from: string }) {}
  async send(message: EmailMessage) {
    if (this.options.demo) return { id: `capture:${message.idempotencyKey}`, captured: true };
    if (!this.options.key) throw new DeliveryError("PROVIDER_NOT_CONFIGURED", true);
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Bearer ${this.options.key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": message.idempotencyKey,
      },
      body: JSON.stringify({
        from: this.options.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok)
      throw new DeliveryError(
        "PROVIDER_REJECTED",
        response.status >= 400 &&
          response.status < 500 &&
          response.status !== 429 &&
          response.status !== 409,
      );
    const data = z.object({ id: z.string().min(1) }).safeParse(await response.json());
    if (!data.success) throw new DeliveryError("PROVIDER_RESPONSE_INVALID", false);
    return { id: data.data.id, captured: false };
  }
}
