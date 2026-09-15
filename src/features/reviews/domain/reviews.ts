export type ReviewAttribution = {
  name: string;
  url?: string;
};

export type PropertyReview = {
  id?: string;
  authorName: string;
  authorPhotoUrl?: string;
  authorProfileUrl?: string;
  rating: number;
  text: string;
  originalText?: string;
  wasTranslated: boolean;
  publishTime?: string;
  relativePublishTime?: string;
  originalReviewUrl?: string;
};

export type PropertyReviews = {
  rating: number | null;
  totalRatingCount: number | null;
  reviews: PropertyReview[];
  googleMapsUrl: string | null;
  allReviewsUrl: string | null;
  writeReviewUrl: string | null;
  attributions: ReviewAttribution[];
};

export interface ReviewsProvider {
  getReviews(): Promise<PropertyReviews>;
}

export type ReviewsResult =
  | {
      status: "ready";
      data: PropertyReviews;
      fallbackGoogleMapsUrl: string | null;
    }
  | {
      status: "unavailable";
      data: null;
      fallbackGoogleMapsUrl: string | null;
    };

export function ratingLabel(rating: number, source?: string): string {
  return source ? `${source} rating: ${rating} out of 5.` : `${rating} out of 5 stars.`;
}
