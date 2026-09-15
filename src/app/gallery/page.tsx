import type { Metadata } from "next";
import { PageHeading, StayInvitation } from "@/features/property/editorial";
import { Gallery } from "@/features/property/gallery";
import { getServerTranslation } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return Translate.meta.pages.gallery;
}

export default async function GalleryPage() {
  const { Translate } = await getServerTranslation();
  return (
    <main id="main-content">
      <PageHeading eyebrow={Translate.gallery.eyebrow} title={Translate.gallery.title}>
        <p>{Translate.gallery.introduction}</p>
      </PageHeading>
      <section className="container gallery-section" aria-label={Translate.gallery.sectionLabel}>
        <Gallery />
        <p className="gallery-disclosure">{Translate.gallery.disclosure}</p>
      </section>
      <StayInvitation />
    </main>
  );
}
