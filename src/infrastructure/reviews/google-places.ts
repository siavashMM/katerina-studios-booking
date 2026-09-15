import "server-only";
import { z } from "zod";
import type { PropertyReviews, ReviewsProvider } from "@/features/reviews/domain/reviews";

export const GOOGLE_PLACE_FIELDS = [
  "rating",
  "userRatingCount",
  "googleMapsUri",
  "googleMapsLinks.placeUri",
  "googleMapsLinks.reviewsUri",
  "googleMapsLinks.writeAReviewUri",
  "attributions.provider",
  "attributions.providerUri",
  "reviews.name",
  "reviews.rating",
  "reviews.text.text",
  "reviews.text.languageCode",
  "reviews.originalText.text",
  "reviews.originalText.languageCode",
  "reviews.publishTime",
  "reviews.relativePublishTimeDescription",
  "reviews.googleMapsUri",
  "reviews.authorAttribution.displayName",
  "reviews.authorAttribution.uri",
  "reviews.authorAttribution.photoUri",
].join(",");

const localizedTextSchema = z.object({
  text: z.string().optional(),
  languageCode: z.string().optional(),
});
const responseSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  googleMapsUri: z.string().optional(),
  googleMapsLinks: z
    .object({
      placeUri: z.string().optional(),
      reviewsUri: z.string().optional(),
      writeAReviewUri: z.string().optional(),
    })
    .optional(),
  attributions: z
    .array(
      z.object({
        provider: z.string().min(1),
        providerUri: z.string().optional(),
      }),
    )
    .optional(),
  reviews: z
    .array(
      z.object({
        name: z.string().optional(),
        rating: z.number().min(1).max(5),
        text: localizedTextSchema.optional(),
        originalText: localizedTextSchema.optional(),
        publishTime: z.string().optional(),
        relativePublishTimeDescription: z.string().optional(),
        googleMapsUri: z.string().optional(),
        authorAttribution: z.object({
          displayName: z.string().min(1),
          uri: z.string().optional(),
          photoUri: z.string().optional(),
        }),
      }),
    )
    .optional(),
});

export type ReviewsProviderErrorCode =
  "INVALID_CONFIGURATION" | "INVALID_RESPONSE" | "NETWORK_ERROR" | "TIMEOUT" | "UPSTREAM_ERROR";

export class ReviewsProviderError extends Error {
  constructor(readonly code: ReviewsProviderErrorCode) {
    super("Google reviews are not available.");
    this.name = "ReviewsProviderError";
  }
}

function safeHttpsUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function mapGooglePlaceResponse(input: unknown): PropertyReviews {
  const result = responseSchema.safeParse(input);
  if (!result.success) throw new ReviewsProviderError("INVALID_RESPONSE");

  const value = result.data;
  return {
    rating: value.rating ?? null,
    totalRatingCount: value.userRatingCount ?? null,
    googleMapsUrl:
      safeHttpsUrl(value.googleMapsUri) ?? safeHttpsUrl(value.googleMapsLinks?.placeUri) ?? null,
    allReviewsUrl: safeHttpsUrl(value.googleMapsLinks?.reviewsUri) ?? null,
    writeReviewUrl: safeHttpsUrl(value.googleMapsLinks?.writeAReviewUri) ?? null,
    attributions: (value.attributions ?? []).map((attribution) => ({
      name: attribution.provider,
      url: safeHttpsUrl(attribution.providerUri),
    })),
    reviews: (value.reviews ?? []).map((review) => {
      const text = review.text?.text ?? "";
      const originalText = review.originalText?.text;
      const wasTranslated = Boolean(
        text &&
        originalText &&
        (text !== originalText ||
          (review.text?.languageCode &&
            review.originalText?.languageCode &&
            review.text.languageCode !== review.originalText.languageCode)),
      );
      return {
        id: review.name,
        authorName: review.authorAttribution.displayName,
        authorPhotoUrl: safeHttpsUrl(review.authorAttribution.photoUri),
        authorProfileUrl: safeHttpsUrl(review.authorAttribution.uri),
        rating: review.rating,
        text,
        originalText,
        wasTranslated,
        publishTime: review.publishTime,
        relativePublishTime: review.relativePublishTimeDescription,
        originalReviewUrl: safeHttpsUrl(review.googleMapsUri),
      };
    }),
  };
}

type GooglePlacesConfig = {
  apiKey: string;
  placeId: string;
  languageCode?: "en" | "el" | "de";
};

type FetchImplementation = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type GooglePlacesDependencies = {
  fetchImpl?: FetchImplementation;
  timeoutMs?: number;
};

export class GooglePlacesReviewsProvider implements ReviewsProvider {
  private readonly fetchImpl: FetchImplementation;
  private readonly timeoutMs: number;

  constructor(
    private readonly config: GooglePlacesConfig,
    dependencies: GooglePlacesDependencies = {},
  ) {
    if (!config.apiKey || !/^[A-Za-z0-9_-]+$/.test(config.placeId) || config.placeId.length > 512) {
      throw new ReviewsProviderError("INVALID_CONFIGURATION");
    }
    this.fetchImpl = dependencies.fetchImpl ?? fetch;
    this.timeoutMs = dependencies.timeoutMs ?? 3500;
  }

  async getReviews(): Promise<PropertyReviews> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(new ReviewsProviderError("TIMEOUT")),
      this.timeoutMs,
    );
    try {
      const url = new URL(
        `https://places.googleapis.com/v1/places/${encodeURIComponent(this.config.placeId)}`,
      );
      url.searchParams.set("languageCode", this.config.languageCode ?? "en");
      url.searchParams.set("regionCode", "GR");
      const response = await this.fetchImpl(url, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "X-Goog-Api-Key": this.config.apiKey,
          "X-Goog-FieldMask": GOOGLE_PLACE_FIELDS,
        },
      });
      if (!response.ok) throw new ReviewsProviderError("UPSTREAM_ERROR");
      return mapGooglePlaceResponse(await response.json());
    } catch (error) {
      if (controller.signal.aborted) throw new ReviewsProviderError("TIMEOUT");
      if (error instanceof ReviewsProviderError) throw error;
      throw new ReviewsProviderError("NETWORK_ERROR");
    } finally {
      clearTimeout(timeout);
    }
  }
}
