import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { prisma } from "../../src/infrastructure/db/client";

const date = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
async function prepareImagesForScreenshot(page: Page) {
  for (const image of await page.locator("main img").all()) {
    await image.scrollIntoViewIfNeeded();
    await image.evaluate((element: HTMLImageElement) =>
      element.complete
        ? undefined
        : new Promise<void>((resolve) => {
            element.addEventListener("load", () => resolve(), { once: true });
            element.addEventListener("error", () => resolve(), { once: true });
          }),
    );
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}
async function expectDesktopHeaderFits(page: Page, language: "el" | "de") {
  for (const width of [1024, 1100, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", language);
    expect(
      await page.locator(".site-header").evaluate((header) => {
        const visibleChildren = Array.from(header.children).filter(
          (child) => getComputedStyle(child).display !== "none",
        );
        const boxes = visibleChildren.map((child) => child.getBoundingClientRect());
        return (
          header.scrollWidth <= header.clientWidth &&
          boxes.every((box, index) => {
            const next = boxes[index + 1];
            return next ? box.right <= next.left + 0.5 : true;
          })
        );
      }),
      `${language} header at ${width}px`,
    ).toBe(true);
  }
}
test.beforeEach(async () => {
  await prisma.rateLimitCounter.deleteMany();
});
test("calendar keyboard selection keeps check-out exclusive", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/booking");
  await page.getByRole("button", { name: "Open calendar" }).click();
  const dialog = page.getByRole("dialog", { name: "Select stay dates" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Next month", exact: true }).click();
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 4));
  const label = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(start);
  await dialog.getByRole("button", { name: label, exact: true }).focus();
  await page.keyboard.press("Enter");
  // The calendar moves focus to the following date after check-in.
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Select a studio" })).toBeVisible();
  await expect(page.getByText("3 nights · 2 guests").first()).toBeVisible();
});
test("mobile menu and gallery restore keyboard focus", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Open menu" });
  await menu.click();
  await expect(page.getByRole("dialog", { name: "Main navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await page.goto("/gallery");
  const photo = page.getByRole("button", { name: /^Open photo 1:/ });
  await photo.click();
  await expect(page.getByRole("dialog", { name: "Photo viewer" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Escape");
  await expect(photo).toBeFocused();
});
test("language switching is immediate, persistent, and preserves form input", async ({
  page,
}, testInfo) => {
  await page.goto(`/booking?checkIn=${date(40)}&checkOut=${date(43)}&guests=2`);
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  await page.getByRole("button", { name: "Select Demo Studio A" }).click();
  const firstName = page.getByRole("textbox", { name: "First name", exact: true });
  await firstName.fill("Katerina");

  await page.getByRole("button", { name: "Select language: English" }).click();
  const languageMenuA11y = await new AxeBuilder({ page }).include(".language-popover").analyze();
  expect(languageMenuA11y.violations).toEqual([]);
  await page.getByRole("menuitem", { name: "Deutsch" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { name: "Ihre Kontaktdaten" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Vorname", exact: true })).toHaveValue("Katerina");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "de");
  await expect(page.getByRole("heading", { name: "Planen Sie Ihren Aufenthalt." })).toBeVisible();
  expect(
    (await page.context().cookies()).find((cookie) => cookie.name === "ks_locale")?.value,
  ).toBe("de");

  await page.getByRole("button", { name: "Sprache auswählen: Deutsch" }).click();
  await page.getByRole("menuitem", { name: "Ελληνικά" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "el");
  await expect(page.getByRole("heading", { name: "Προγραμματίστε τη διαμονή σας." })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("ks-locale-v1"))).toBe("el");

  if (testInfo.project.name === "chromium") {
    await expectDesktopHeaderFits(page, "el");
    await page.setViewportSize({ width: 320, height: 844 });
    for (const path of [
      "/",
      "/studios",
      "/about",
      "/gallery",
      "/location",
      "/reviews",
      "/booking",
      "/website-plans",
    ]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", "el");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `Greek ${path} at 320px`,
      ).toBe(true);
    }

    await page.goto("/");
    await page.getByRole("button", { name: "Άνοιγμα μενού" }).click();
    const mobileMenu = page.getByRole("dialog", { name: "Κύρια πλοήγηση" });
    await mobileMenu.getByRole("button", { name: "Επιλογή γλώσσας: Ελληνικά" }).click();
    await page.getByRole("menuitem", { name: "Deutsch" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await page.keyboard.press("Escape");

    for (const path of [
      "/",
      "/studios",
      "/about",
      "/gallery",
      "/location",
      "/reviews",
      "/booking",
      "/website-plans",
    ]) {
      await page.goto(path);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `German ${path} at 320px`,
      ).toBe(true);
    }
    await expectDesktopHeaderFits(page, "de");
  }
});
test("location guide selects a place and offers directions", async ({ page }) => {
  await page.goto("/location");
  const monastery = page.getByRole("button", { name: /Paleokastritsa Monastery/ });
  await monastery.click();
  await expect(monastery).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".area-map-selection").getByRole("heading")).toHaveText(
    "Paleokastritsa Monastery",
  );
  await expect(
    page.getByRole("link", { name: /Open directions to Paleokastritsa Monastery/ }),
  ).toBeVisible();
});
test("website proposal explains prices, plan boundaries, and next actions", async ({ page }) => {
  await page.goto("/website-plans");

  const plans = page.getByRole("region", { name: "Three clear ways to own the website." });
  const cards = plans.getByRole("article");
  await expect(cards).toHaveCount(3);

  await expect(cards.nth(0).getByText("Direct booking", { exact: true })).toBeVisible();
  await expect(cards.nth(0).getByText("€1,490", { exact: true })).toBeVisible();
  await expect(cards.nth(0).getByText(/€65 per hour/)).toBeVisible();

  await expect(cards.nth(1).getByText("Recommended", { exact: true })).toBeVisible();
  await expect(cards.nth(1).getByText("€2,790", { exact: true })).toBeVisible();

  await expect(cards.nth(2).getByText("Full management", { exact: true }).first()).toBeVisible();
  await expect(cards.nth(2).getByText("From €3,990", { exact: true })).toBeVisible();
  await expect(
    cards.nth(2).getByText("External booking-channel integration where technically supported"),
  ).toBeVisible();

  await expect(page.getByRole("heading", { name: "30 days to make it yours." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compare the plans." })).toBeVisible();
  await expect(page.getByText("External costs", { exact: true })).toBeVisible();

  const comparison = page.getByRole("region", { name: "Compare the plans." });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(comparison.getByRole("table")).toBeHidden();
  await expect(comparison.getByRole("heading", { name: "Website", level: 3 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(comparison.getByRole("table")).toBeVisible();
  await expect(comparison.getByRole("heading", { name: "Website", level: 3 })).toBeHidden();

  await expect(page.getByRole("link", { name: /Choose Essential/ })).toHaveAttribute(
    "href",
    "#next-step",
  );
  await expect(page.getByRole("link", { name: /Choose Owner Control/ })).toHaveAttribute(
    "href",
    "#next-step",
  );
  await expect(page.getByRole("link", { name: /Discuss Full Control/ })).toHaveAttribute(
    "href",
    "#next-step",
  );
});
test("guest request, review, receipt reload, and private response", async ({ page }) => {
  await page.goto(`/booking?checkIn=${date(40)}&checkOut=${date(43)}&guests=2`);
  await page.getByRole("button", { name: "Check availability", exact: true }).click();
  await page.getByRole("button", { name: "Select Demo Studio A" }).click();
  await page.getByRole("textbox", { name: "First name", exact: true }).fill("Browser");
  await page.getByRole("textbox", { name: "Last name", exact: true }).fill("Guest");
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("browser@example.test");
  await page.getByRole("button", { name: "Review request" }).click();
  await expect(
    page.getByText("Your request does not hold these dates.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("checkbox").check();
  const response = page.waitForResponse(
    (item) => item.url().endsWith("/api/booking-requests") && item.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Send booking request" }).click();
  expect((await response).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "Thank you for your request." })).toBeVisible();
  const reference = await page.locator(".receipt-reference strong").innerText();
  await page.reload();
  await expect(page.locator(".receipt-reference")).toContainText(reference);
  expect(
    (await page.context().cookies()).find((cookie) => cookie.name === "ks_receipt")?.httpOnly,
  ).toBe(true);
  expect(await page.evaluate(() => JSON.stringify(sessionStorage))).not.toContain(
    "browser@example.test",
  );
});
test("public pages have no serious accessibility faults or overflow", async ({
  page,
}, testInfo) => {
  for (const path of [
    "/",
    "/studios",
    "/about",
    "/gallery",
    "/location",
    "/reviews",
    "/booking",
    "/privacy",
    "/terms",
    "/cancellation",
    "/website-plans",
  ]) {
    await page.goto(path);
    await expect(page.locator("main h1")).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations,
      `${path}: ${JSON.stringify(result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })))}`,
    ).toEqual([]);
  }
  if (testInfo.project.name === "chromium") {
    for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/",
        "/about",
        "/reviews",
        "/booking",
        "/gallery",
        "/location",
        "/website-plans",
      ]) {
        await page.goto(path);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
          `${path} at ${width}`,
        ).toBe(true);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("/");
    await prepareImagesForScreenshot(page);
    await page.screenshot({ path: "test-results/home-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await prepareImagesForScreenshot(page);
    await page.screenshot({ path: "test-results/home-mobile.png", fullPage: true });
    await page.goto("/about");
    await prepareImagesForScreenshot(page);
    await page.screenshot({ path: "test-results/about-mobile.png", fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await prepareImagesForScreenshot(page);
    await page.screenshot({ path: "test-results/about-desktop.png", fullPage: true });
    await page.goto("/reviews");
    await page.screenshot({ path: "test-results/reviews-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "test-results/reviews-mobile.png", fullPage: true });
  }
});
test("family story is factual and reviews fail without false data", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Website plans" })).toHaveAttribute(
    "href",
    "/website-plans",
  );

  await page.goto("/about");
  await expect(page.getByRole("heading", { name: "Our Story" })).toBeVisible();
  await expect(page.getByText(/family-run place to stay/i)).toBeVisible();
  await expect(page.getByText(/generations of hospitality/i)).toHaveCount(0);
  await expect(page.getByText(/founded in/i)).toHaveCount(0);

  await page.goto("/reviews");
  await expect(page.getByRole("heading", { name: "Guest Reviews" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Reviews are not available now." })).toBeVisible();
  await expect(page.getByText("4.9", { exact: true })).toHaveCount(0);
});
test("owner records and receipt reject unauthenticated access", async ({ page, request }) => {
  await page.goto("/admin/reservations");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/booking/received");
  await expect(page.getByRole("heading", { name: "This receipt is not available." })).toBeVisible();
  const response = await request.post("/api/booking-requests", { data: {} });
  expect(response.status()).toBe(403);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["content-security-policy"]).toContain("nonce-");
});
