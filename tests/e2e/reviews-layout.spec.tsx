import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const styles = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8").replace(
  '@import "tailwindcss";',
  "",
);
const longReview =
  "The studio gave us a comfortable base for our stay. We enjoyed the hillside setting and the view from the balcony. The review text is intentionally long so that this test can check line wrapping, spacing, and readable text width on each screen size. ";
const stars = `<span class="rating-stars" role="img" aria-label="Google rating: 4.8 out of 5." aria-hidden="false">★★★★★</span>`;
const reviewStars = (rating: number) =>
  `<span class="rating-stars" role="img" aria-label="Rating: ${rating} out of 5.">★★★★★</span>`;
const externalHint = `<span class="sr-only"> (opens a new tab)</span>`;
const googleMapsLogo = `data:image/svg+xml;base64,${readFileSync(
  resolve(process.cwd(), "public/brand/google-maps-logo-gray.svg"),
).toString("base64")}`;
const googleMapsAttribution = `<span class="google-maps-attribution" translate="no"><img src="${googleMapsLogo}" width="98" height="18" alt="Google Maps"></span>`;
const content = `
  <main id="main-content">
    <h1 class="sr-only">Guest Reviews</h1>
    <section class="container reviews-page-section" aria-labelledby="reviews-list-title">
      <div class="reviews-page-summary">
        <div class="reviews-rating-summary">
          <p class="eyebrow">Guest feedback</p>
          <span class="reviews-rating-number" aria-hidden="true">4.8</span>
          ${stars}
          <p class="reviews-rating-label">Google rating</p>
          <p class="reviews-rating-count">Based on 128 Google reviews.</p>
          ${googleMapsAttribution}
        </div>
        <div class="reviews-page-actions">
          <a class="text-link" href="https://www.google.com/maps/place/example/reviews" target="_blank" rel="noopener noreferrer">
            Read all reviews on Google Maps ${externalHint}
          </a>
          <a class="text-link" href="https://www.google.com/maps/place/example/write-review" target="_blank" rel="noopener noreferrer">
            Write a review on Google ${externalHint}
          </a>
        </div>
      </div>
      <div class="reviews-page-list">
        <div class="reviews-page-list-heading">
          <p class="eyebrow">From Google Maps</p>
          <h2 id="reviews-list-title">Guest reviews.</h2>
        </div>
        <article class="review-entry">
          <header class="review-entry-header">
            <a class="review-author" href="https://www.google.com/maps/contrib/example" target="_blank" rel="noopener noreferrer">
              <span class="review-avatar review-avatar-fallback" aria-hidden="true">AV</span>
              <strong>A very long reviewer name that must wrap without horizontal overflow</strong>
              ${externalHint}
            </a>
            <div class="review-entry-meta">
              ${reviewStars(5)}
              <time datetime="2026-07-10T10:00:00Z">2 months ago</time>
            </div>
          </header>
          <blockquote><p>${longReview.repeat(2)}</p></blockquote>
          <a class="review-source-link" href="https://www.google.com/maps/reviews/example-one" target="_blank" rel="noopener noreferrer">
            View this review on Google Maps ${externalHint}
          </a>
        </article>
        <article class="review-entry">
          <header class="review-entry-header">
            <div class="review-author">
              <span class="review-avatar review-avatar-fallback" aria-hidden="true">GT</span>
              <strong>Guest Two</strong>
            </div>
            <div class="review-entry-meta">
              ${reviewStars(4)}
              <span>5 months ago</span>
            </div>
          </header>
          <blockquote><p>A clear review with a missing author photo and profile link.</p></blockquote>
          <p class="review-translation-note">Google Maps translated this review.</p>
          <a class="review-source-link" href="https://www.google.com/maps/reviews/example-two" target="_blank" rel="noopener noreferrer">
            View this review on Google Maps ${externalHint}
          </a>
        </article>
        <div class="reviews-notice">
          <div class="reviews-attribution-line"><span>Reviews supplied by</span>${googleMapsAttribution}</div>
          <p>Google Maps returns up to five reviews in relevance order. No search or rating filter is applied.</p>
          <p>
            Google does not verify reviews. It checks for fake content and removes it when found.
            <a href="https://support.google.com/contributionpolicy/answer/7422880" target="_blank" rel="noopener noreferrer">Read the Google Maps review policy${externalHint}</a>.
          </p>
        </div>
      </div>
    </section>
  </main>
`;
const documentMarkup = `<!doctype html><html lang="en"><head><title>Guest Reviews layout test</title><style>${styles}</style></head><body>${content}</body></html>`;
const homepageContent = `
  <main id="main-content">
    <h1 class="sr-only">Katerina Studios</h1>
    <section class="home-reviews" aria-labelledby="home-reviews-title">
      <div class="container home-reviews-heading">
        <p class="eyebrow">Google reviews</p>
        <h2 id="home-reviews-title">Words from our guests.</h2>
        <a class="text-link" href="/reviews">Guest Reviews</a>
      </div>
      <div class="container home-reviews-layout">
        <div class="reviews-rating-summary">
          <p class="eyebrow">Guest feedback</p>
          <span class="reviews-rating-number" aria-hidden="true">4.8</span>
          ${stars}
          <p class="reviews-rating-label">Google rating</p>
          <p class="reviews-rating-count">Based on 128 Google reviews.</p>
          ${googleMapsAttribution}
        </div>
        <div class="home-review-list">
          <article class="review-entry">
            <header class="review-entry-header">
              <div class="review-author">
                <span class="review-avatar review-avatar-fallback" aria-hidden="true">AV</span>
                <strong>A very long reviewer name that must wrap without horizontal overflow</strong>
              </div>
              <div class="review-entry-meta">${reviewStars(5)}<span>2 months ago</span></div>
            </header>
            <blockquote><p>${longReview.repeat(2)}</p></blockquote>
            <a class="review-source-link" href="https://www.google.com/maps/reviews/example-one">View this review on Google Maps</a>
          </article>
          <article class="review-entry">
            <header class="review-entry-header">
              <div class="review-author">
                <span class="review-avatar review-avatar-fallback" aria-hidden="true">GT</span>
                <strong>Guest Two</strong>
              </div>
              <div class="review-entry-meta">${reviewStars(4)}<span>5 months ago</span></div>
            </header>
            <blockquote><p>A clear second review.</p></blockquote>
          </article>
          <a class="text-link" href="https://www.google.com/maps/place/example/reviews">Read all reviews on Google Maps</a>
          <div class="reviews-notice">
            <div class="reviews-attribution-line"><span>Review preview supplied by</span>${googleMapsAttribution}</div>
            <p>Google Maps returns up to five reviews in relevance order. No search or rating filter is applied.</p>
          </div>
        </div>
      </div>
    </section>
  </main>
`;
const homepageDocumentMarkup = `<!doctype html><html lang="en"><head><title>Homepage review layout test</title><style>${styles}</style></head><body>${homepageContent}</body></html>`;

test("populated Google reviews are accessible and responsive", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "The width matrix runs once in Chromium.");

  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(documentMarkup);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `populated reviews at ${width}`,
    ).toBe(true);
    await expect(page.getByRole("img", { name: "Google rating: 4.8 out of 5." })).toBeVisible();
    await expect(page.getByText(/very long reviewer name/)).toBeVisible();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(documentMarkup);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({ path: "test-results/reviews-populated-mobile.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.setContent(documentMarkup);
  await page.screenshot({ path: "test-results/reviews-populated-desktop.png", fullPage: true });
});

test("the populated homepage review section is accessible and responsive", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "The width matrix runs once in Chromium.");

  for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.setContent(homepageDocumentMarkup);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      `homepage reviews at ${width}`,
    ).toBe(true);
    await expect(page.getByText(/very long reviewer name/)).toBeVisible();
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.setContent(homepageDocumentMarkup);
  const ratingBox = await page.locator(".reviews-rating-summary").boundingBox();
  const firstReviewBox = await page.locator(".review-entry").first().boundingBox();
  expect(ratingBox?.y).toBeLessThan(firstReviewBox?.y ?? 0);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({ path: "test-results/home-reviews-populated-mobile.png", fullPage: true });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.setContent(homepageDocumentMarkup);
  await page.screenshot({
    path: "test-results/home-reviews-populated-desktop.png",
    fullPage: true,
  });
});
