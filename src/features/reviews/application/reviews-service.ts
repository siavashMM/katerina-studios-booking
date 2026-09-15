import type { ReviewsProvider, ReviewsResult } from "../domain/reviews";

type ReviewsServiceOptions = {
  fallbackGoogleMapsUrl?: string | null;
  onError?: (code: "REVIEWS_PROVIDER_FAILED") => void;
};

export async function getPropertyReviews(
  provider: ReviewsProvider | null,
  options: ReviewsServiceOptions = {},
): Promise<ReviewsResult> {
  const fallbackGoogleMapsUrl = options.fallbackGoogleMapsUrl ?? null;
  if (!provider) {
    return { status: "unavailable", data: null, fallbackGoogleMapsUrl };
  }

  try {
    const data = await provider.getReviews();
    return {
      status: "ready",
      data,
      fallbackGoogleMapsUrl: data.googleMapsUrl ?? fallbackGoogleMapsUrl,
    };
  } catch {
    options.onError?.("REVIEWS_PROVIDER_FAILED");
    return { status: "unavailable", data: null, fallbackGoogleMapsUrl };
  }
}
