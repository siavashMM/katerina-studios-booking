import type { Metadata } from "next";
import { PageHeading, StayInvitation } from "@/features/property/editorial";
import { Gallery } from "@/features/property/gallery";
import { getServerTranslation } from "@/i18n/server";
import { getPublicProperty } from "@/features/property/public-data";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return Translate.meta.pages.gallery;
}

export default async function GalleryPage() {
  const { Translate } = await getServerTranslation();
  const managed = await getPublicProperty();
  const managedPhotos = [
    ...(managed?.media.map((media) => media.photo) ?? []),
    ...(managed?.accommodations.flatMap((studio) => studio.media.map((media) => media.photo)) ??
      []),
  ];
  return (
    <main id="main-content">
      <PageHeading eyebrow={Translate.gallery.eyebrow} title={Translate.gallery.title}>
        <p>{Translate.gallery.introduction}</p>
      </PageHeading>
      <section className="container gallery-section" aria-label={Translate.gallery.sectionLabel}>
        <Gallery {...(managedPhotos.length ? { selection: managedPhotos } : {})} />
        <p className="gallery-disclosure">{Translate.gallery.disclosure}</p>
      </section>
      <StayInvitation />
    </main>
  );
}
