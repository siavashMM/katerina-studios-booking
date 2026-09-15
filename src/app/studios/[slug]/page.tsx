import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnv } from "@/config/env";
import { ArrowIcon } from "@/components/ui/icons";
import { demoStudios } from "@/content/property";
import { getPhoto } from "@/content/photos";
import { Gallery } from "@/features/property/gallery";
import { Photo } from "@/features/property/photo";
import { PracticalInformation } from "@/features/property/editorial";
import { getServerTranslation } from "@/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const studio = demoStudios.find((item) => item.slug === slug);
  const { Translate } = await getServerTranslation();
  const title = studio
    ? Translate.studios.items[studio.slug].name
    : Translate.studioDetail.fallbackTitle;
  return { title, robots: { index: false, follow: false } };
}

export default async function StudioPage({ params }: Props) {
  const { slug } = await params;
  const studio = demoStudios.find((item) => item.slug === slug);
  if (!getEnv().DEMO_MODE || !studio) notFound();
  const { Translate } = await getServerTranslation();
  const copy = Translate.studios.items[studio.slug];
  return (
    <main id="main-content">
      <div className="container studio-detail-heading">
        <Link href="/studios" className="text-link back-link">
          <ArrowIcon /> {Translate.studioDetail.all}
        </Link>
        <p className="eyebrow">{Translate.studioDetail.eyebrow}</p>
        <h1>{copy.name}</h1>
        <p>{copy.title}</p>
      </div>
      <div className="container studio-detail-hero">
        <Photo id={studio.photoIds[0]} sizes="90vw" priority />
      </div>
      <section className="container section studio-detail-body">
        <div>
          <p className="eyebrow">{Translate.studioDetail.insideEyebrow}</p>
          <h2>{Translate.studioDetail.insideHeading}</h2>
          <p>{copy.description}</p>
          <p>{Translate.studioDetail.generalPhotos}</p>
          <div className="notice">
            <strong>{Translate.studioDetail.sampleTitle}</strong>
            <p>{Translate.studioDetail.sampleText}</p>
          </div>
        </div>
        <aside className="studio-booking-panel">
          <p className="eyebrow">{Translate.common.planYourStay}</p>
          <h3>{Translate.studioDetail.chooseDates}</h3>
          <p>{Translate.studioDetail.availabilityText}</p>
          <Link href={`/booking?studio=${studio.slug}`} className="button">
            {Translate.common.checkAvailability} <ArrowIcon />
          </Link>
          <span className="small muted">{Translate.studioDetail.confirmation}</span>
        </aside>
      </section>
      <section className="container studio-gallery-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{Translate.studioDetail.galleryEyebrow}</p>
            <h2>{Translate.studioDetail.galleryHeading}</h2>
          </div>
          <Link href="/gallery" className="text-link">
            {Translate.studioDetail.allPhotos} <ArrowIcon />
          </Link>
        </div>
        <Gallery selection={studio.photoIds.map(getPhoto)} />
      </section>
      <PracticalInformation />
    </main>
  );
}
