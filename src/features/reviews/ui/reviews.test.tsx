import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { ReviewsResult } from "../domain/reviews";
import { HomepageReviews, RatingStars, ReviewsPageReviews } from "./reviews";

const unavailable: ReviewsResult = {
  status: "unavailable",
  data: null,
  fallbackGoogleMapsUrl: null,
};

describe("review presentation fallbacks", () => {
  it("hides the homepage section when no verified review data or link exists", () => {
    expect(renderToStaticMarkup(<HomepageReviews result={unavailable} />)).toBe("");
  });

  it("keeps the reviews page useful without showing fake review data", () => {
    const html = renderToStaticMarkup(<ReviewsPageReviews result={unavailable} />);
    expect(html).toContain("Reviews are not available now.");
    expect(html).not.toContain("4.9");
    expect(html).not.toContain("review-card");
  });

  it("adds accessible text to a visual rating", () => {
    const html = renderToStaticMarkup(<RatingStars rating={4.9} source="Google" />);
    expect(html).toContain('aria-label="Google rating: 4.9 out of 5."');
  });

  it("preserves author and source attribution for live review data", () => {
    const result: ReviewsResult = {
      status: "ready",
      fallbackGoogleMapsUrl: null,
      data: {
        rating: 4.7,
        totalRatingCount: 18,
        googleMapsUrl: "https://www.google.com/maps/place/example",
        allReviewsUrl: "https://www.google.com/maps/place/example/reviews",
        writeReviewUrl: "https://www.google.com/maps/place/example/review",
        attributions: [],
        reviews: [
          {
            id: "review-one",
            authorName: "A very long reviewer name for layout checks",
            rating: 5,
            text: "The full review text stays unchanged.",
            wasTranslated: false,
            relativePublishTime: "one month ago",
            originalReviewUrl: "https://www.google.com/maps/reviews/one",
          },
        ],
      },
    };
    const html = renderToStaticMarkup(<ReviewsPageReviews result={result} />);
    expect(html).toContain("A very long reviewer name for layout checks");
    expect(html).toContain("The full review text stays unchanged.");
    expect(html).toContain("View this review on Google Maps");
    expect(html).toContain("Read all reviews on Google Maps");
    expect(html).toContain("5 out of 5 stars.");
    expect(html).toContain('translate="no"');
    expect(html).toContain("/brand/google-maps-logo-gray.svg");
    expect(html).toContain('alt="Google Maps"');
    expect(html).toContain("No search or rating filter is applied.");
  });

  it("shows the first two provider reviews in the homepage preview order", () => {
    const result: ReviewsResult = {
      status: "ready",
      fallbackGoogleMapsUrl: null,
      data: {
        rating: 4.8,
        totalRatingCount: 24,
        googleMapsUrl: "https://www.google.com/maps/place/example",
        allReviewsUrl: "https://www.google.com/maps/place/example/reviews",
        writeReviewUrl: null,
        attributions: [],
        reviews: ["First review", "Second review", "Third review"].map((authorName, index) => ({
          id: `review-${index}`,
          authorName,
          rating: 5 - index,
          text: `Review text ${index}`,
          wasTranslated: false,
        })),
      },
    };
    const html = renderToStaticMarkup(<HomepageReviews result={result} />);
    expect(html.indexOf("First review")).toBeLessThan(html.indexOf("Second review"));
    expect(html).not.toContain("Third review");
    expect(html).toContain("Read all reviews on Google Maps");
    expect(html).toContain('alt="Google Maps"');
  });
});
