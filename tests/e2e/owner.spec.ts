import { randomUUID } from "node:crypto";
import { test, expect, type BrowserContext } from "@playwright/test";
import { prisma } from "../../src/infrastructure/db/client";
import { PostgresSessionStore } from "../../src/infrastructure/auth/session-store";
import { createBookingService } from "../../src/features/booking/application/booking-service";
import AxeBuilder from "@axe-core/playwright";
// Use the locked SDK cookie format. This fixture is never part of the application.
import { encrypt } from "../../node_modules/@auth0/nextjs-auth0/dist/server/cookies.js";

async function ownerSession(context: BrowserContext, mfa = true) {
  const property = await prisma.property.findUniqueOrThrow({ where: { slug: "katerina-studios" } });
  const subject = `test-owner-${randomUUID()}`;
  const membership = await prisma.ownerMembership.create({
    data: {
      propertyId: property.id,
      issuer: "https://identity.example.test/",
      authSubject: subject,
      email: "owner@example.test",
    },
  });
  const id = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000);
  await new PostgresSessionStore().set(id, {
    user: { sub: subject, iss: membership.issuer, amr: mfa ? ["mfa"] : ["pwd"] },
    tokenSet: { accessToken: "fixture-only", expiresAt: timestamp + 3600 },
    internal: { sid: id, createdAt: timestamp },
  });
  const cookie = await encrypt({ id }, process.env.AUTH0_SECRET!, timestamp + 1800);
  await context.addCookies([
    {
      name: "__session",
      value: cookie,
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  return { id, membership };
}

test("owner confirms and cancels a request through protected controls", async ({
  page,
  context,
}) => {
  await prisma.rateLimitCounter.deleteMany();
  await ownerSession(context);
  const studio = await prisma.accommodation.findUniqueOrThrow({ where: { slug: "demo-studio-b" } });
  const checkIn = new Date(Date.now() + 70 * 86400000).toISOString().slice(0, 10);
  const checkOut = new Date(Date.now() + 72 * 86400000).toISOString().slice(0, 10);
  const service = createBookingService(prisma, {
    demoMode: true,
    receiptSecret: process.env.RECEIPT_SECRET!,
  });
  const quote = await service.getQuote({
    accommodationId: studio.id,
    checkIn,
    checkOut,
    guests: 2,
  });
  const { receipt } = await service.createRequest({
    accommodationId: studio.id,
    checkIn,
    checkOut,
    guests: 2,
    idempotencyKey: randomUUID(),
    quoteFingerprint: quote.fingerprint,
    guest: { firstName: "Owner", lastName: "Test", email: "owner-test@example.test" },
    policyAccepted: true,
  });
  const row = await prisma.reservation.findUniqueOrThrow({
    where: { reference: receipt.reference },
  });
  await page.goto("/admin/reservations");
  await page.getByRole("textbox", { name: "Search", exact: true }).fill("owner-test@example.test");
  const searchResponse = page.waitForResponse((response) =>
    response.url().endsWith("/api/admin/reservations/search"),
  );
  await page.getByRole("button", { name: "Apply filters" }).click();
  expect((await searchResponse).status()).toBe(200);
  expect(page.url()).not.toContain("owner-test");
  await expect(page.getByRole("link", { name: receipt.reference, exact: true })).toBeVisible();
  await page.goto(`/admin/reservations/${row.id}`);
  await expect(
    page.getByRole("button", { name: "Confirm reservation", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm reservation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel reservation", exact: true })).toBeVisible();
  expect(
    await prisma.inventoryAllocation.count({ where: { reservationId: row.id, active: true } }),
  ).toBe(1);
  await page.getByRole("button", { name: "Cancel reservation", exact: true }).click();
  await page.getByRole("button", { name: "Confirm cancellation" }).click();
  await expect(page.getByText("No further status changes are available.")).toBeVisible();
  expect(
    await prisma.inventoryAllocation.count({ where: { reservationId: row.id, active: true } }),
  ).toBe(0);
});
test("missing MFA denies owner access", async ({ page, context }) => {
  const session = await ownerSession(context, false);
  await page.goto("/admin/reservations");
  await expect(page).toHaveURL(/\/admin\/login/);
  await new PostgresSessionStore().delete(session.id);
});
test("revocation denies owner access", async ({ page, context }) => {
  const valid = await ownerSession(context);
  await page.goto("/admin/reservations");
  await expect(page.getByRole("heading", { name: "Reservations" })).toBeVisible();
  await prisma.ownerMembership.update({
    where: { id: valid.membership.id },
    data: { active: false },
  });
  await page.reload();
  await expect(page).toHaveURL(/\/admin\/login/);
  await new PostgresSessionStore().delete(valid.id);
});
test("owner manages blocks and rates on a small screen", async ({ page, context }) => {
  await prisma.rateLimitCounter.deleteMany();
  await ownerSession(context);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/admin/availability");
  const checkIn = new Date(Date.now() + 150 * 86400000).toISOString().slice(0, 10);
  const checkOut = new Date(Date.now() + 152 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel("First blocked date").fill(checkIn);
  await page.getByLabel("First available date").fill(checkOut);
  await page.getByLabel("Reason", { exact: true }).fill("Browser test block");
  await page.getByRole("button", { name: "Block dates", exact: true }).click();
  await expect(page.getByText("Browser test block", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove block" }).click();
  await expect(page.getByText("No manual date blocks exist.")).toBeVisible();
  await page.goto("/admin/rates");
  const first = page
    .locator("form")
    .filter({ has: page.getByRole("heading", { name: "Demo Studio A", exact: true }) });
  await first.getByLabel("Base nightly price (EUR)", { exact: true }).fill("65.00");
  await first.getByRole("button", { name: "Save rates" }).click();
  await expect(first.getByRole("status")).toContainText("Rates saved");
  await expect(first.getByRole("button", { name: "Save rates" })).toBeEnabled();
  expect(
    (await prisma.accommodation.findUniqueOrThrow({ where: { slug: "demo-studio-a" } }))
      .basePriceCents,
  ).toBe(6500);
  for (const path of [
    "/admin/reservations",
    "/admin/availability",
    "/admin/rates",
    "/admin/notifications",
  ]) {
    await page.goto(path);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      path,
    ).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations,
      `${path}: ${JSON.stringify(result.violations.map((item) => item.id))}`,
    ).toEqual([]);
  }
});
