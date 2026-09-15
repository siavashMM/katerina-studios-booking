import "server-only";
import { cache } from "react";
import { getEnv, googleReviewsConfigured } from "@/config/env";
import { logEvent } from "@/infrastructure/logging/logger";
import { GooglePlacesReviewsProvider } from "@/infrastructure/reviews/google-places";
import { getServerLocale } from "@/i18n/server";
import { getPropertyReviews } from "./application/reviews-service";

// React cache shares one result only during a server render. Google review data is not
// placed in the Next.js persistent cache or the database.
export const loadPropertyReviews = cache(async () => {
  const env = getEnv();
  const locale = await getServerLocale();
  const provider = googleReviewsConfigured(env)
    ? new GooglePlacesReviewsProvider({
        apiKey: env.GOOGLE_PLACES_API_KEY!,
        placeId: env.GOOGLE_PLACE_ID!,
        languageCode: locale,
      })
    : null;

  return getPropertyReviews(provider, {
    fallbackGoogleMapsUrl: env.GOOGLE_MAPS_URL,
    onError: (code) => logEvent("warn", { event: "google_reviews_unavailable", code }),
  });
});
