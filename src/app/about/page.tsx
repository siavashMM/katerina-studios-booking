import type { Metadata } from "next";
import Link from "next/link";
import { ArrowIcon, LeafIcon, SeaIcon } from "@/components/ui/icons";
import { property } from "@/content/property";
import { Photo } from "@/features/property/photo";
import { getServerTranslation } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { Translate } = await getServerTranslation();
  return Translate.meta.pages.about;
}

export default async function AboutPage() {
  const { Translate } = await getServerTranslation();
  const story = Translate.property.familyStory;
  const storyAssets = property.familyStory;
  return (
    <main id="main-content">
      <section className="container about-hero" aria-labelledby="about-title">
        <Photo id="olive-grove" sizes="(max-width: 767px) 100vw, 92vw" priority />
        <div className="about-hero-shade" aria-hidden="true" />
        <div className="about-hero-copy">
          <p className="eyebrow">{Translate.about.eyebrow}</p>
          <h1 id="about-title">{Translate.about.title}</h1>
          <p>{story.supportingLine}</p>
        </div>
        <p className="about-hero-caption">{Translate.about.heroCaption}</p>
      </section>

      <section className="container section about-introduction">
        <div>
          <LeafIcon width={32} height={32} />
          <p className="eyebrow">{Translate.about.familyEyebrow}</p>
          <h2>{story.heading}</h2>
        </div>
        <div>
          <p className="lead">{story.introduction}</p>
        </div>
      </section>

      <section className="about-place section">
        <div className="container about-place-grid">
          <figure className="about-place-primary">
            <Photo id={storyAssets.place.primaryPhotoId} sizes="(max-width: 767px) 100vw, 44vw" />
            <figcaption>{Translate.about.pathCaption}</figcaption>
          </figure>
          <div className="about-place-copy">
            <p className="eyebrow">{Translate.about.placeEyebrow}</p>
            <h2>{story.place.heading}</h2>
            {story.place.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <figure className="about-place-secondary">
            <Photo id={storyAssets.place.secondaryPhotoId} sizes="(max-width: 767px) 90vw, 31vw" />
            <figcaption>{Translate.about.studiosCaption}</figcaption>
          </figure>
        </div>
      </section>

      <section className="container section about-coast">
        <div className="about-coast-copy">
          <SeaIcon width={34} height={34} />
          <p className="eyebrow">{Translate.about.coastEyebrow}</p>
          <h2>{story.paleokastritsa.heading}</h2>
          {story.paleokastritsa.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <Link href="/location" className="text-link">
            {Translate.about.locationLink} <ArrowIcon />
          </Link>
        </div>
        <figure>
          <Photo id={storyAssets.paleokastritsa.photoId} sizes="(max-width: 767px) 100vw, 55vw" />
          <figcaption>{Translate.about.balconyCaption}</figcaption>
        </figure>
      </section>

      {storyAssets.hostName && storyAssets.hostPhotoId && storyAssets.hostBiography ? (
        <section className="container section about-host">
          <Photo id={storyAssets.hostPhotoId} sizes="(max-width: 767px) 90vw, 38vw" />
          <div>
            <p className="eyebrow">{Translate.about.host}</p>
            <h2>{storyAssets.hostName}</h2>
            <p>{storyAssets.hostBiography}</p>
            {storyAssets.welcomeMessage ? (
              <p className="lead">{storyAssets.welcomeMessage}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="about-actions">
        <div className="container about-actions-inner">
          <div>
            <p className="eyebrow">{Translate.about.actionEyebrow}</p>
            <h2>{Translate.about.actionHeading}</h2>
          </div>
          <div className="about-action-links">
            <Link href="/booking" className="button button-light">
              {Translate.common.checkAvailability} <ArrowIcon />
            </Link>
            <Link href="/studios" className="button about-secondary-action">
              {Translate.about.exploreStudios} <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
