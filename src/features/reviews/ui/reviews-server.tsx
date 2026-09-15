import "server-only";
import { connection } from "next/server";
import { loadPropertyReviews } from "../server";
import { HomepageReviews, ReviewsPageReviews } from "./reviews";

export async function HomepageReviewsSection() {
  await connection();
  return <HomepageReviews result={await loadPropertyReviews()} />;
}

export async function ReviewsPageSection() {
  await connection();
  return <ReviewsPageReviews result={await loadPropertyReviews()} />;
}
