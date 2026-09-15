"use client";

/* eslint-disable @next/next/no-img-element -- Google supplies reviewer images and the official attribution asset. */
import Link from "next/link";
import { ArrowIcon, StarIcon } from "@/components/ui/icons";
import { useTranslation } from "@/i18n/client";
import { type PropertyReview, type PropertyReviews, type ReviewsResult } from "../domain/reviews";

const GOOGLE_REVIEW_POLICY_URL = "https://support.google.com/contributionpolicy/answer/7422880";

export function RatingStars({ rating, source }: { rating: number; source?: string }) {
  const filledStars = Math.round(rating);
  const { Translate, t, formatNumber } = useTranslation();
  const label = t(source ? Translate.reviews.sourceRating : Translate.reviews.rating, {
    rating: formatNumber(rating),
    ...(source ? { source } : {}),
  });
  return (
    <span className="rating-stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon key={star} className={star <= filledStars ? "star-filled" : "star-empty"} />
      ))}
    </span>
  );
}

function GoogleMapsAttribution() {
  return (
    <span className="google-maps-attribution" translate="no">
      <img src="/brand/google-maps-logo-gray.svg" width="98" height="18" alt="Google Maps" />
    </span>
  );
}

function AuthorAvatar({ review }: { review: PropertyReview }) {
  if (review.authorPhotoUrl) {
    return (
      <img
        className="review-avatar"
        src={review.authorPhotoUrl}
        width="48"
        height="48"
        loading="lazy"
        decoding="async"
        alt=""
        referrerPolicy="no-referrer"
      />
    );
  }
  const initials = review.authorName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.at(0))
    .join("")
    .toUpperCase();
  return (
    <span className="review-avatar review-avatar-fallback" aria-hidden="true">
      {initials}
    </span>
  );
}

function ReviewAuthor({ review }: { review: PropertyReview }) {
  const { Translate } = useTranslation();
  const contents = (
    <>
      <AuthorAvatar review={review} />
      <strong>{review.authorName}</strong>
    </>
  );
  return review.authorProfileUrl ? (
    <a
      className="review-author"
      href={review.authorProfileUrl}
      target="_blank"
      rel="noopener noreferrer"
    >
      {contents}
      <span className="sr-only">{Translate.reviews.authorOnGoogle}</span>
    </a>
  ) : (
    <div className="review-author">{contents}</div>
  );
}

function ReviewDate({ review }: { review: PropertyReview }) {
  const { formatDate } = useTranslation();
  const label = review.relativePublishTime;
  if (!label) return null;
  return review.publishTime ? (
    <time dateTime={review.publishTime}>
      {formatDate(new Date(review.publishTime), { dateStyle: "medium" })}
    </time>
  ) : (
    <span>{label}</span>
  );
}

function ReviewEntry({ review }: { review: PropertyReview }) {
  const { Translate } = useTranslation();
  return (
    <article className="review-entry">
      <header className="review-entry-header">
        <ReviewAuthor review={review} />
        <div className="review-entry-meta">
          <RatingStars rating={review.rating} />
          <ReviewDate review={review} />
        </div>
      </header>
      {review.text ? (
        <blockquote>
          <p>{review.text}</p>
        </blockquote>
      ) : (
        <p className="review-rating-only">{Translate.reviews.ratingOnly}</p>
      )}
      {review.wasTranslated ? (
        <p className="review-translation-note">{Translate.reviews.translated}</p>
      ) : null}
      {review.originalReviewUrl ? (
        <a
          className="review-source-link"
          href={review.originalReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {Translate.reviews.viewReview} <ArrowIcon />
          <span className="sr-only">{Translate.common.openInNewTab}</span>
        </a>
      ) : null}
    </article>
  );
}

function RatingSummary({ reviews }: { reviews: PropertyReviews }) {
  const { Translate, t, formatNumber } = useTranslation();
  const countLabel =
    reviews.totalRatingCount === null
      ? null
      : t(Translate.reviews.googleReview, {
          count: formatNumber(reviews.totalRatingCount),
        });
  return (
    <div className="reviews-rating-summary">
      <p className="eyebrow">{Translate.reviews.feedback}</p>
      {reviews.rating !== null ? (
        <>
          <span className="reviews-rating-number" aria-hidden="true">
            {formatNumber(reviews.rating, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <RatingStars rating={reviews.rating} source="Google" />
        </>
      ) : null}
      <p className="reviews-rating-label">{Translate.reviews.googleRating}</p>
      {countLabel ? (
        <p className="reviews-rating-count">{t(Translate.reviews.basedOn, { countLabel })}</p>
      ) : null}
      <GoogleMapsAttribution />
    </div>
  );
}

function ReviewNotice({
  reviews,
  preview = false,
}: {
  reviews: PropertyReviews;
  preview?: boolean;
}) {
  const { Translate } = useTranslation();
  return (
    <div className="reviews-notice">
      <div className="reviews-attribution-line">
        <span>{preview ? Translate.reviews.previewBy : Translate.reviews.suppliedBy}</span>
        <GoogleMapsAttribution />
      </div>
      <p>{Translate.reviews.relevance}</p>
      <p>
        {Translate.reviews.policyLead}{" "}
        <a href={GOOGLE_REVIEW_POLICY_URL} target="_blank" rel="noopener noreferrer">
          {Translate.reviews.policyLink}
          <span className="sr-only">{Translate.common.openInNewTab}</span>
        </a>
        .
      </p>
      {reviews.attributions.length > 0 ? (
        <p className="review-data-attributions">
          {Translate.reviews.otherProviders}{" "}
          {reviews.attributions.map((attribution, index) => (
            <span key={`${attribution.name}-${index}`}>
              {index > 0 ? ", " : null}
              {attribution.url ? (
                <a href={attribution.url} target="_blank" rel="noopener noreferrer">
                  {attribution.name}
                  <span className="sr-only">{Translate.common.openInNewTab}</span>
                </a>
              ) : (
                attribution.name
              )}
            </span>
          ))}
          .
        </p>
      ) : null}
    </div>
  );
}

function GoogleActionLink({ href, children }: { href: string; children: React.ReactNode }) {
  const { Translate } = useTranslation();
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-link">
      {children} <ArrowIcon />
      <span className="sr-only">{Translate.common.openInNewTab}</span>
    </a>
  );
}

function fallbackUrl(result: ReviewsResult): string | null {
  return result.status === "ready"
    ? (result.data.allReviewsUrl ?? result.data.googleMapsUrl ?? result.fallbackGoogleMapsUrl)
    : result.fallbackGoogleMapsUrl;
}

function hasReviewData(reviews: PropertyReviews): boolean {
  return reviews.rating !== null || reviews.totalRatingCount !== null || reviews.reviews.length > 0;
}

export function HomepageReviews({ result }: { result: ReviewsResult }) {
  const { Translate } = useTranslation();
  const link = fallbackUrl(result);
  if (result.status !== "ready" || !hasReviewData(result.data)) {
    return link ? (
      <section className="home-reviews-link-only">
        <div className="container">
          <p>{Translate.reviews.seeOnGoogle}</p>
          <GoogleActionLink href={link}>{Translate.reviews.openGoogle}</GoogleActionLink>
        </div>
      </section>
    ) : null;
  }

  const reviews = result.data;
  return (
    <section className="home-reviews" aria-labelledby="home-reviews-title">
      <div className="container home-reviews-heading">
        <p className="eyebrow">{Translate.reviews.homeEyebrow}</p>
        <h2 id="home-reviews-title">{Translate.reviews.homeHeading}</h2>
        <Link href="/reviews" className="text-link">
          {Translate.reviews.homeLink} <ArrowIcon />
        </Link>
      </div>
      <div className="container home-reviews-layout">
        <RatingSummary reviews={reviews} />
        <div className="home-review-list">
          {reviews.reviews.slice(0, 2).map((review, index) => (
            <ReviewEntry
              key={review.id ?? `${review.authorName}-${review.publishTime ?? index}`}
              review={review}
            />
          ))}
          {reviews.reviews.length === 0 ? (
            <p className="reviews-empty-copy">{Translate.reviews.noWritten}</p>
          ) : null}
          {link ? (
            <GoogleActionLink href={link}>{Translate.reviews.readAll}</GoogleActionLink>
          ) : null}
          <ReviewNotice reviews={reviews} preview />
        </div>
      </div>
    </section>
  );
}

function ReviewsUnavailable({ link }: { link: string | null }) {
  const { Translate } = useTranslation();
  return (
    <section className="container reviews-unavailable">
      <p className="eyebrow">{Translate.reviews.unavailableEyebrow}</p>
      <h2>{Translate.reviews.unavailableHeading}</h2>
      <p>{Translate.reviews.unavailableText}</p>
      {link ? (
        <GoogleActionLink href={link}>{Translate.reviews.viewProperty}</GoogleActionLink>
      ) : null}
    </section>
  );
}

export function ReviewsPageReviews({ result }: { result: ReviewsResult }) {
  const { Translate } = useTranslation();
  const link = fallbackUrl(result);
  if (result.status !== "ready" || !hasReviewData(result.data)) {
    return <ReviewsUnavailable link={link} />;
  }

  const reviews = result.data;
  return (
    <section className="container reviews-page-section" aria-labelledby="reviews-list-title">
      <div className="reviews-page-summary">
        <RatingSummary reviews={reviews} />
        <div className="reviews-page-actions">
          {link ? (
            <GoogleActionLink href={link}>{Translate.reviews.readAll}</GoogleActionLink>
          ) : null}
          {reviews.writeReviewUrl ? (
            <GoogleActionLink href={reviews.writeReviewUrl}>
              {Translate.reviews.write}
            </GoogleActionLink>
          ) : null}
        </div>
      </div>
      <div className="reviews-page-list">
        <div className="reviews-page-list-heading">
          <p className="eyebrow">{Translate.reviews.fromGoogle}</p>
          <h2 id="reviews-list-title">{Translate.reviews.listHeading}</h2>
        </div>
        {reviews.reviews.map((review, index) => (
          <ReviewEntry
            key={review.id ?? `${review.authorName}-${review.publishTime ?? index}`}
            review={review}
          />
        ))}
        {reviews.reviews.length === 0 ? (
          <p className="reviews-empty-copy">{Translate.reviews.noWritten}</p>
        ) : null}
        <ReviewNotice reviews={reviews} />
      </div>
    </section>
  );
}
