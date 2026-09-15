import type { Metadata } from "next";
import { ArrowIcon, PinIcon } from "@/components/ui/icons";
import { AreaMap } from "@/features/property/area-map";
import { PageHeading, StayInvitation } from "@/features/property/editorial";
import { Photo } from "@/features/property/photo";
import { getServerTranslation } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return Translate.meta.pages.location;
}

export default async function LocationPage() {
  const { Translate } = await getServerTranslation();
  return (
    <main id="main-content">
      <PageHeading eyebrow={Translate.location.eyebrow} title={Translate.location.title}>
        <p>{Translate.location.introduction}</p>
      </PageHeading>
      <div className="container location-hero">
        <Photo id="coastal-cliffs" sizes="92vw" priority />
      </div>
      <section className="container section location-story">
        <div>
          <p className="eyebrow">{Translate.location.island}</p>
          <h2>{Translate.location.heading}</h2>
        </div>
        <div>
          <p className="lead">{Translate.location.lead}</p>
          <p>{Translate.location.paragraph1}</p>
          <p>{Translate.location.paragraph2}</p>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Paleokastritsa%2C%20Corfu%2C%20Greece"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            {Translate.location.areaMap} <ArrowIcon />
            <span className="sr-only">{Translate.common.openInNewTab}</span>
          </a>
        </div>
      </section>
      <AreaMap />
      <section className="container location-image-pair">
        <figure>
          <Photo id="olive-grove" />
          <figcaption>{Translate.location.oliveCaption}</figcaption>
        </figure>
        <figure>
          <Photo id="coast-at-dusk" />
          <figcaption>{Translate.location.coastCaption}</figcaption>
        </figure>
      </section>
      <section className="container section arrival-section">
        <div className="arrival-card">
          <PinIcon width={32} height={32} />
          <p className="eyebrow">{Translate.location.arrivalEyebrow}</p>
          <h2>{Translate.location.arrivalHeading}</h2>
          <dl>
            {Translate.location.arrival.map(({ term, detail }) => (
              <div key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="arrival-photo">
          <Photo id="garden-path" sizes="(max-width: 767px) 90vw, 45vw" />
        </div>
      </section>
      <StayInvitation />
    </main>
  );
}
