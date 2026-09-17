import type { Metadata } from "next";
import Link from "next/link";
import { getEnv } from "@/config/env";
import { ArrowIcon } from "@/components/ui/icons";
import { demoStudios } from "@/content/property";
import { Photo } from "@/features/property/photo";
import { nonEmpty } from "@/features/property/managed-content";
import { getPublicProperty } from "@/features/property/public-data";
import { PageHeading, PracticalInformation, StayInvitation } from "@/features/property/editorial";
import { getServerTranslation } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return Translate.meta.pages.studios;
}

export default async function StudiosPage() {
  const demo = getEnv().DEMO_MODE;
  const { Translate, t } = await getServerTranslation();
  const managed = await getPublicProperty();
  const studios =
    managed?.accommodations.map((studio) => {
      const fallback = demoStudios.find((item) => item.slug === studio.slug) ?? demoStudios[0];
      const copy = Translate.studios.items[fallback.slug];
      return {
        slug: studio.slug,
        name: studio.name,
        title: nonEmpty(studio.shortDescription, copy.title),
        description: nonEmpty(studio.fullDescription, copy.description),
        photo: studio.media[0]?.photo,
        fallbackPhotoId: fallback.photoIds[0],
      };
    }) ??
    demoStudios.map((studio) => {
      const copy = Translate.studios.items[studio.slug];
      return {
        slug: studio.slug,
        name: copy.name,
        title: copy.title,
        description: copy.description,
        photo: undefined,
        fallbackPhotoId: studio.photoIds[0],
      };
    });
  return (
    <main id="main-content">
      <PageHeading eyebrow={Translate.studios.eyebrow} title={Translate.studios.title}>
        <p>{Translate.studios.introduction}</p>
      </PageHeading>
      <div className="container">
        {demo ? (
          <div className="notice studio-demo-note">
            <strong>{Translate.studios.exampleTitle}</strong>
            <p>{Translate.studios.exampleText}</p>
          </div>
        ) : null}
        {studios.length ? (
          <div className="studio-list">
            {studios.map((studio, index) => {
              return (
                <article className="studio-row" key={studio.slug}>
                  <Link
                    href={`/studios/${studio.slug}`}
                    className="studio-row-photo"
                    aria-label={t(Translate.studios.explore, { name: studio.name })}
                  >
                    <Photo
                      {...(studio.photo ? { photo: studio.photo } : { id: studio.fallbackPhotoId })}
                      sizes="(max-width: 767px) 90vw, 52vw"
                    />
                  </Link>
                  <div className="studio-row-copy">
                    <p className="eyebrow">
                      0{index + 1} · {Translate.studios.demonstration}
                    </p>
                    <h2>{studio.name}</h2>
                    <p className="studio-tagline">{studio.title}</p>
                    <p>{studio.description}</p>
                    <div className="studio-row-actions">
                      <Link href={`/studios/${studio.slug}`} className="text-link">
                        {Translate.studios.seeExample} <ArrowIcon />
                      </Link>
                      <Link
                        href={`/booking?studio=${studio.slug}`}
                        className="button button-secondary"
                      >
                        {Translate.studios.checkDates} <ArrowIcon />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="section studio-live-intro">
            <Photo id="studio-blue-bed" />
            <div>
              <h2>{Translate.studios.liveHeading}</h2>
              <p>{Translate.studios.liveText}</p>
              <Link href="/booking" className="button">
                {Translate.common.checkAvailability} <ArrowIcon />
              </Link>
            </div>
          </section>
        )}
      </div>
      <section className="studio-details-band">
        <div className="container">
          <p className="eyebrow">{Translate.studios.detailsEyebrow}</p>
          <h2>{Translate.studios.detailsHeading}</h2>
          <div className="observed-features">
            {Translate.studios.features.map(({ name, description }) => (
              <p key={name}>
                {name}
                <span>{description}</span>
              </p>
            ))}
          </div>
          <p className="small muted">{Translate.studios.verifyNote}</p>
        </div>
      </section>
      <PracticalInformation />
      <StayInvitation />
    </main>
  );
}
