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

test("direct request reaches the owner calendar and closes availability", async ({
  page,
  context,
}, testInfo) => {
  await prisma.rateLimitCounter.deleteMany();
  await ownerSession(context);
  const projectOffset = { chromium: 250, firefox: 260, webkit: 270 }[testInfo.project.name] ?? 280;
  const checkIn = new Date(Date.now() + projectOffset * 86400000).toISOString().slice(0, 10);
  const checkOut = new Date(Date.now() + (projectOffset + 3) * 86400000).toISOString().slice(0, 10);

  await page.goto(`/booking?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  await page.getByRole("button", { name: "Select Demo Studio A" }).click();
  await page.getByRole("textbox", { name: "First name", exact: true }).fill("Flow");
  await page.getByRole("textbox", { name: "Last name", exact: true }).fill("Guest");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("flow@example.test");
  await page.getByRole("button", { name: "Review request" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send booking request" }).click();
  await expect(page.getByRole("heading", { name: "Thank you for your request." })).toBeVisible();
  const reference = await page.locator(".receipt-reference strong").innerText();

  await page.goto("/admin/reservations");
  await page.getByRole("textbox", { name: "Search", exact: true }).fill(reference);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await page.getByRole("link", { name: reference, exact: true }).click();
  await expect(page.getByRole("heading", { name: "Flow Guest" })).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Confirm reservation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cancel reservation", exact: true })).toBeVisible();

  await page.goto(`/admin/calendar?month=${checkIn.slice(0, 7)}`);
  await expect(page.getByRole("link", { name: /Flow Guest/ }).first()).toBeVisible();

  await page.goto(`/booking?checkIn=${checkIn}&checkOut=${checkOut}&guests=2`);
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  await expect(page.getByRole("button", { name: "Select Demo Studio A" })).toHaveCount(0);
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
test("Owner Control hides Full Control navigation", async ({ page, context }) => {
  const property = await prisma.property.findUniqueOrThrow({ where: { slug: "katerina-studios" } });
  await prisma.property.update({
    where: { id: property.id },
    data: { portalPlan: "OWNER_CONTROL" },
  });
  try {
    await ownerSession(context);
    await page.goto("/admin/reservations");
    await expect(page.getByRole("link", { name: "Bookings", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Property", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Photos", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Pricing", exact: true })).toHaveCount(0);
  } finally {
    await prisma.property.update({
      where: { id: property.id },
      data: { portalPlan: "FULL_CONTROL" },
    });
  }
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

test("owner portal fits the required responsive widths", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Run the responsive matrix once.");
  await ownerSession(context);

  const keyRoutes = [
    "/admin/reservations",
    "/admin/calendar",
    "/admin/messages",
    "/admin/settings",
  ];
  const widths = [320, 390, 430, 768, 1024, 1440, 1920];

  for (const width of widths) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const path of keyRoutes) {
      await page.goto(path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }

  const remainingRoutes = [
    "/admin/availability",
    "/admin/property",
    "/admin/photos",
    "/admin/rates",
    "/admin/notifications",
  ];
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
    for (const path of remainingRoutes) {
      await page.goto(path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${path} at ${width}px`,
      ).toBe(true);
    }
  }
});

test("admin styles do not leak into the public header", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Run the route-style check once.");
  await ownerSession(context);
  await page.setViewportSize({ width: 768, height: 1024 });

  await page.goto("/");
  const expected = await page.locator(".mobile-menu-button").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderTopColor: style.borderTopColor,
      display: style.display,
      paddingLeft: style.paddingLeft,
    };
  });

  await page.goto("/admin/reservations");
  await page.getByRole("link", { name: "Katerina Studios website" }).click();
  await expect(page).toHaveURL("/");
  const afterAdmin = await page.locator(".mobile-menu-button").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderTopColor: style.borderTopColor,
      display: style.display,
      paddingLeft: style.paddingLeft,
    };
  });

  expect(afterAdmin).toEqual(expected);
});
