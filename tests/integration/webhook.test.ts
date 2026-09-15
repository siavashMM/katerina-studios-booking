import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { POST } from "../../src/app/api/webhooks/resend/route";
import { prisma } from "../../src/infrastructure/db/client";

const eventId = randomUUID();
const key = randomBytes(32);
const previous = process.env.RESEND_WEBHOOK_SECRET;
afterAll(async () => {
  if (previous === undefined) delete process.env.RESEND_WEBHOOK_SECRET;
  else process.env.RESEND_WEBHOOK_SECRET = previous;
  await prisma.processedWebhook.deleteMany({ where: { eventId } });
});
describe("signed delivery webhook", () => {
  it("accepts an authentic event and rejects a changed payload", async () => {
    process.env.RESEND_WEBHOOK_SECRET = `whsec_${key.toString("base64")}`;
    const timestamp = String(Math.floor(Date.now() / 1000));
    const body = JSON.stringify({
      type: "email.delivered",
      created_at: new Date().toISOString(),
      data: { email_id: randomUUID() },
    });
    const signature = createHmac("sha256", key)
      .update(`${eventId}.${timestamp}.${body}`)
      .digest("base64");
    const headers = {
      "svix-id": eventId,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
    };
    const response = await POST(
      new Request("http://localhost/api/webhooks/resend", { method: "POST", headers, body }),
    );
    expect(response.status).toBe(200);
    const changed = await POST(
      new Request("http://localhost/api/webhooks/resend", {
        method: "POST",
        headers,
        body: `${body} `,
      }),
    );
    expect(changed.status).toBe(401);
  });
});
