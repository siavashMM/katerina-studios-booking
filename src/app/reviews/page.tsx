import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeading, StayInvitation } from "@/features/property/editorial";
import { ReviewsPageSection } from "@/features/reviews/ui/reviews-server";
import { getServerTranslation } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return Translate.meta.pages.reviews;
}

export default async function ReviewsPage() {
  const { Translate } = await getServerTranslation();
  return (
    <main id="main-content">
      <PageHeading eyebrow={Translate.reviews.pageEyebrow} title={Translate.reviews.pageTitle}>
        <p>{Translate.reviews.pageIntroduction}</p>
      </PageHeading>
      <Suspense
        fallback={
          <section className="container reviews-loading" aria-live="polite">
            <p>{Translate.reviews.loading}</p>
          </section>
        }
      >
        <ReviewsPageSection />
      </Suspense>
      <StayInvitation />
    </main>
  );
}
