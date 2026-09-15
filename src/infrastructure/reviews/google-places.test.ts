import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  GOOGLE_PLACE_FIELDS,
  GooglePlacesReviewsProvider,
  ReviewsProviderError,
  mapGooglePlaceResponse,
} from "./google-places";

const completeResponse = {
  rating: 4.9,
  userRatingCount: 107,
  googleMapsUri: "https://www.google.com/maps/place/example",
  googleMapsLinks: {
    reviewsUri: "https://www.google.com/maps/place/example/reviews",
    writeAReviewUri: "https://www.google.com/maps/place/example/review",
  },
  attributions: [{ provider: "Example data", providerUri: "https://example.test/data" }],
  reviews: [
    {
      name: "places/test/reviews/one",
      rating: 5,
      text: { text: "A quiet stay.", languageCode: "en" },
      originalText: { text: "A quiet stay.", languageCode: "en" },
      relativePublishTimeDescription: "2 months ago",
      publishTime: "2026-07-10T10:00:00Z",
      googleMapsUri: "https://www.google.com/maps/reviews/one",
      authorAttribution: {
        displayName: "Long Reviewer Name",
        uri: "https://www.google.com/maps/contrib/example",
        photoUri: "https://lh3.googleusercontent.com/example",
      },
    },
  ],
};

describe("Google Places response mapping", () => {
  it("maps ratings, counts, links, attribution, and review authors", () => {
    expect(mapGooglePlaceResponse(completeResponse)).toEqual({
      rating: 4.9,
      totalRatingCount: 107,
      googleMapsUrl: "https://www.google.com/maps/place/example",
      allReviewsUrl: "https://www.google.com/maps/place/example/reviews",
      writeReviewUrl: "https://www.google.com/maps/place/example/review",
      attributions: [{ name: "Example data", url: "https://example.test/data" }],
      reviews: [
        {
          id: "places/test/reviews/one",
          authorName: "Long Reviewer Name",
          authorPhotoUrl: "https://lh3.googleusercontent.com/example",
          authorProfileUrl: "https://www.google.com/maps/contrib/example",
          rating: 5,
          text: "A quiet stay.",
          originalText: "A quiet stay.",
          wasTranslated: false,
          publishTime: "2026-07-10T10:00:00Z",
          relativePublishTime: "2 months ago",
          originalReviewUrl: "https://www.google.com/maps/reviews/one",
        },
      ],
    });
  });

  it("keeps valid reviews when optional author, text, date, and URL fields are missing", () => {
    expect(
      mapGooglePlaceResponse({
        reviews: [
          {
            rating: 4,
            authorAttribution: { displayName: "Guest" },
          },
        ],
      }),
    ).toEqual({
      rating: null,
      totalRatingCount: null,
      googleMapsUrl: null,
      allReviewsUrl: null,
      writeReviewUrl: null,
      attributions: [],
      reviews: [
        {
          id: undefined,
          authorName: "Guest",
          authorPhotoUrl: undefined,
          authorProfileUrl: undefined,
          rating: 4,
          text: "",
          originalText: undefined,
          wasTranslated: false,
          publishTime: undefined,
          relativePublishTime: undefined,
          originalReviewUrl: undefined,
        },
      ],
    });
  });

  it("maps an empty review list and rejects unsafe or invalid response values", () => {
    expect(mapGooglePlaceResponse({ reviews: [] }).reviews).toEqual([]);
    expect(
      mapGooglePlaceResponse({
        googleMapsUri: "javascript:alert(1)",
        reviews: [],
      }).googleMapsUrl,
    ).toBeNull();
    expect(() => mapGooglePlaceResponse({ rating: 7 })).toThrow(ReviewsProviderError);
  });
});

describe("Google Places provider", () => {
  it("uses the official endpoint, a field mask, and no persistent cache", async () => {
    const calls: Array<[string | URL | Request, RequestInit | undefined]> = [];
    const fetchImpl = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      calls.push([input, init]);
      return new Response(JSON.stringify(completeResponse), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    const provider = new GooglePlacesReviewsProvider(
      { apiKey: "server-secret", placeId: "ChIJ_test-place" },
      { fetchImpl, timeoutMs: 100 },
    );

    await expect(provider.getReviews()).resolves.toMatchObject({ rating: 4.9 });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = calls[0]!;
    expect(String(url)).toContain("https://places.googleapis.com/v1/places/ChIJ_test-place");
    expect(init).toMatchObject({
      cache: "no-store",
      headers: {
        "X-Goog-Api-Key": "server-secret",
        "X-Goog-FieldMask": GOOGLE_PLACE_FIELDS,
      },
    });
  });

  it("rejects non-success responses without exposing the upstream message", async () => {
    const provider = new GooglePlacesReviewsProvider(
      { apiKey: "server-secret", placeId: "ChIJ_test-place" },
      {
        fetchImpl: vi.fn(async () => new Response("upstream secret", { status: 403 })),
        timeoutMs: 100,
      },
    );
    await expect(provider.getReviews()).rejects.toMatchObject({ code: "UPSTREAM_ERROR" });
    await expect(provider.getReviews()).rejects.not.toThrow("upstream secret");
  });

  it("stops a request after the configured timeout", async () => {
    const fetchImpl = vi.fn(
      (_url: URL | RequestInfo, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason), {
            once: true,
          });
        }),
    );
    const provider = new GooglePlacesReviewsProvider(
      { apiKey: "server-secret", placeId: "ChIJ_test-place" },
      { fetchImpl, timeoutMs: 5 },
    );
    await expect(provider.getReviews()).rejects.toMatchObject({ code: "TIMEOUT" });
  });
});
