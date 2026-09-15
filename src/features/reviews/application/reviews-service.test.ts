import { describe, expect, it, vi } from "vitest";
import { getPropertyReviews } from "./reviews-service";
import type { PropertyReviews, ReviewsProvider } from "../domain/reviews";

const reviews: PropertyReviews = {
  rating: 4.8,
  totalRatingCount: 42,
  reviews: [],
  googleMapsUrl: "https://www.google.com/maps/place/example",
  allReviewsUrl: null,
  writeReviewUrl: null,
  attributions: [],
};

class FakeReviewsProvider implements ReviewsProvider {
  constructor(private readonly result: PropertyReviews | Error) {}

  async getReviews(): Promise<PropertyReviews> {
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

describe("review application service", () => {
  it("returns the provider result, including an empty review list", async () => {
    await expect(getPropertyReviews(new FakeReviewsProvider(reviews))).resolves.toEqual({
      status: "ready",
      data: reviews,
      fallbackGoogleMapsUrl: reviews.googleMapsUrl,
    });
  });

  it("contains a provider failure and keeps a configured Google Maps link", async () => {
    const onError = vi.fn();
    await expect(
      getPropertyReviews(new FakeReviewsProvider(new Error("secret provider error")), {
        fallbackGoogleMapsUrl: "https://maps.app.goo.gl/example",
        onError,
      }),
    ).resolves.toEqual({
      status: "unavailable",
      data: null,
      fallbackGoogleMapsUrl: "https://maps.app.goo.gl/example",
    });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledWith("REVIEWS_PROVIDER_FAILED");
  });

  it("does not call a provider when reviews are not configured", async () => {
    await expect(getPropertyReviews(null)).resolves.toEqual({
      status: "unavailable",
      data: null,
      fallbackGoogleMapsUrl: null,
    });
  });
});
