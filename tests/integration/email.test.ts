import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/infrastructure/db/client";
import { processOutbox } from "../../src/infrastructure/email/outbox";
import { recordDeliveryEvent } from "../../src/infrastructure/email/webhook";
import { DeliveryError, type EmailProvider } from "../../src/infrastructure/email/provider";

const ids: string[] = [];
async function job(extra = {}) {
  const row = await prisma.emailOutbox.create({
    data: {
      kind: "GUEST_REQUESTED",
      recipient: "guest@example.test",
      idempotencyKey: randomUUID(),
      payload: {
        reference: "KS-12345678901234567890",
        guestName: "Test <script>guest</script>",
        accommodationName: "Demo studio",
        checkIn: "2027-04-01",
        checkOut: "2027-04-03",
        guestCount: 2,
        nights: 2,
        totalCents: 12000,
        currency: "EUR",
        policySummary: "Demo policy",
        status: "PENDING",
        cashOnArrival: true,
      },
      ...extra,
    },
  });
  ids.push(row.id);
  return row;
}
afterEach(async () => {
  await prisma.emailOutbox.deleteMany({ where: { id: { in: ids } } });
  ids.length = 0;
});

describe("durable email delivery", () => {
  it("claims each message once with concurrent workers", async () => {
    const row = await job();
    let calls = 0;
    const provider: EmailProvider = {
      async send() {
        calls++;
        return { id: "test-provider-id", captured: false };
      },
    };
    await Promise.all([
      processOutbox(provider, { ids: [row.id] }),
      processOutbox(provider, { ids: [row.id] }),
    ]);
    expect(calls).toBe(1);
    expect((await prisma.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).status).toBe(
      "SENT",
    );
  });
  it("keeps failed sends for retry without removing the event", async () => {
    const row = await job();
    await processOutbox(
      {
        async send() {
          throw new DeliveryError("TEMPORARY", false);
        },
      },
      { ids: [row.id] },
    );
    const result = await prisma.emailOutbox.findUniqueOrThrow({ where: { id: row.id } });
    expect(result.status).toBe("QUEUED");
    expect(result.attempts).toBe(1);
    expect(result.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());
  });
  it("recovers an expired lease with the same provider idempotency key", async () => {
    const row = await job({
      status: "PROCESSING",
      lockedAt: new Date(Date.now() - 300000),
      lockedBy: "stopped-worker",
      firstAttemptAt: new Date(),
      attempts: 1,
    });
    let key = "";
    await processOutbox(
      {
        async send(message) {
          key = message.idempotencyKey;
          return { id: "recovered", captured: false };
        },
      },
      { ids: [row.id] },
    );
    expect(key).toBe(row.idempotencyKey);
    expect((await prisma.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).attempts).toBe(
      2,
    );
  });
  it("does not retry an uncertain send outside the provider window", async () => {
    const row = await job({ firstAttemptAt: new Date(Date.now() - 25 * 3600000), attempts: 2 });
    let calls = 0;
    await processOutbox(
      {
        async send() {
          calls++;
          return { id: "never", captured: false };
        },
      },
      { ids: [row.id] },
    );
    expect(calls).toBe(0);
    expect((await prisma.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).status).toBe(
      "UNCERTAIN",
    );
  });
  it("captures demo messages instead of sending them", async () => {
    const row = await job();
    await processOutbox(
      {
        async send() {
          return { id: "captured", captured: true };
        },
      },
      { ids: [row.id] },
    );
    expect((await prisma.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).status).toBe(
      "SKIPPED",
    );
  });
  it("records repeated delivery events once and preserves an early failure", async () => {
    const row = await job();
    const providerId = randomUUID();
    const eventId = randomUUID();
    try {
      await Promise.all([
        recordDeliveryEvent(eventId, "email.bounced", providerId),
        recordDeliveryEvent(eventId, "email.bounced", providerId),
      ]);
      await processOutbox(
        {
          async send() {
            return { id: providerId, captured: false };
          },
        },
        { ids: [row.id] },
      );
      expect((await prisma.emailOutbox.findUniqueOrThrow({ where: { id: row.id } })).status).toBe(
        "FAILED",
      );
      expect(await prisma.processedWebhook.count({ where: { eventId } })).toBe(1);
    } finally {
      await prisma.processedWebhook.deleteMany({ where: { eventId } });
    }
  });
});
