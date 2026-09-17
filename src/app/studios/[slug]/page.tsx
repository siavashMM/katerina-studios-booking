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
import { nonEmpty } from "@/features/property/managed-content";
import { getPublicProperty } from "@/features/property/public-data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const managed = await getPublicProperty();
  const studio = managed?.accommodations.find((item) => item.slug === slug);
  const fallback = demoStudios.find((item) => item.slug === slug);
  const { Translate } = await getServerTranslation();
  const title =
    studio?.name ??
    (fallback ? Translate.studios.items[fallback.slug].name : Translate.studioDetail.fallbackTitle);
  return { title, robots: { index: false, follow: false } };
}

export default async function StudioPage({ params }: Props) {
  const { slug } = await params;
  const managed = await getPublicProperty();
  const studio = managed?.accommodations.find((item) => item.slug === slug);
  const fallback = demoStudios.find((item) => item.slug === slug);
  if (!studio && (!getEnv().DEMO_MODE || !fallback)) notFound();
  const { Translate } = await getServerTranslation();
  const copy = Translate.studios.items[(fallback ?? demoStudios[0]).slug];
  const name = studio?.name ?? copy.name;
  const title = nonEmpty(studio?.shortDescription, copy.title);
  const description = nonEmpty(studio?.fullDescription, copy.description);
  const photos = studio?.media.map((media) => media.photo) ?? [];
  const hero = photos[0];
  const fallbackPhotos = (fallback ?? demoStudios[0]).photoIds;
  const amenities = Array.isArray(studio?.amenities)
    ? studio.amenities.filter((item): item is string => typeof item === "string")
    : [];
  return (
    <main id="main-content">
      <div className="container studio-detail-heading">
        <Link href="/studios" className="text-link back-link">
          <ArrowIcon /> {Translate.studioDetail.all}
        </Link>
        <p className="eyebrow">{Translate.studioDetail.eyebrow}</p>
        <h1>{name}</h1>
        <p>{title}</p>
      </div>
      <div className="container studio-detail-hero">
        <Photo {...(hero ? { photo: hero } : { id: fallbackPhotos[0] })} sizes="90vw" priority />
      </div>
      <section className="container section studio-detail-body">
        <div>
          <p className="eyebrow">{Translate.studioDetail.insideEyebrow}</p>
          <h2>{Translate.studioDetail.insideHeading}</h2>
          <p>{description}</p>
          {studio?.beds ? (
            <p>
              <strong>Beds:</strong> {studio.beds}
            </p>
          ) : null}
          {amenities.length ? (
            <ul className="studio-amenities">
              {amenities.map((amenity) => (
                <li key={amenity}>{amenity}</li>
              ))}
            </ul>
          ) : null}
          <p>{Translate.studioDetail.generalPhotos}</p>
          {getEnv().DEMO_MODE ? (
            <div className="notice">
              <strong>{Translate.studioDetail.sampleTitle}</strong>
              <p>{Translate.studioDetail.sampleText}</p>
            </div>
          ) : null}
        </div>
        <aside className="studio-booking-panel">
          <p className="eyebrow">{Translate.common.planYourStay}</p>
          <h3>{Translate.studioDetail.chooseDates}</h3>
          <p>{Translate.studioDetail.availabilityText}</p>
          <Link href={`/booking?studio=${slug}`} className="button">
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
        <Gallery selection={photos.length ? photos : fallbackPhotos.map(getPhoto)} />
      </section>
      <PracticalInformation />
    </main>
  );
}
