import Link from "next/link";
import { Suspense } from "react";
import { ArrowIcon, CalendarIcon, LeafIcon, PinIcon, SeaIcon } from "@/components/ui/icons";
import { getEnv } from "@/config/env";
import { homeStoryPhoto } from "@/content/editorial-photos";
import { Photo } from "@/features/property/photo";
import { nonEmpty } from "@/features/property/managed-content";
import { getPublicProperty } from "@/features/property/public-data";
import { PracticalInformation, StayInvitation } from "@/features/property/editorial";
import { HomepageReviewsSection } from "@/features/reviews/ui/reviews-server";
import { getServerTranslation } from "@/i18n/server";

export default async function Home() {
  const demo = getEnv().DEMO_MODE;
  const { Translate, t } = await getServerTranslation();
  const managed = await getPublicProperty();
  const heroPhoto = managed?.media.find((media) => media.isHero)?.photo;
  const storyIntroduction = nonEmpty(
    managed?.content?.introduction,
    Translate.property.familyStory.introduction,
  );
  const locationSummary = nonEmpty(managed?.content?.locationSummary, Translate.home.location.text);
  return (
    <main id="main-content">
      <section className="home-hero" aria-labelledby="home-hero-title">
        <span className="header-scroll-sentinel" data-header-sentinel aria-hidden="true" />
        <Photo
          {...(heroPhoto ? { photo: heroPhoto } : { id: "balcony-striped-chairs" })}
          className="hero-photo"
          sizes="100vw"
          priority
        />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="container hero-content">
          <div className="hero-heading">
            <div>
              <p className="eyebrow">{Translate.home.hero.eyebrow}</p>
              <h1 id="home-hero-title">
                <span className="hero-brand-name">Katerina Studios</span>
                <span className="hero-tagline">{Translate.home.hero.tagline}</span>
              </h1>
            </div>
            <div className="hero-introduction">
              <Link href="/studios" className="text-link">
                {Translate.home.hero.explore} <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-booking-panel">
          <form action="/booking" className="container home-search" autoComplete="off">
            <div className="search-intro">
              <CalendarIcon />
              <span>{Translate.home.search.title}</span>
            </div>
            <label className="search-field">
              <span>{Translate.home.search.checkIn}</span>
              <input
                type="date"
                name="checkIn"
                aria-label={Translate.home.search.checkInLabel}
                autoComplete="off"
              />
            </label>
            <label className="search-field">
              <span>{Translate.home.search.checkOut}</span>
              <input
                type="date"
                name="checkOut"
                aria-label={Translate.home.search.checkOutLabel}
                autoComplete="off"
              />
            </label>
            <label className="search-field search-guests">
              <span>{Translate.home.search.guests}</span>
              <select
                name="guests"
                defaultValue="2"
                aria-label={Translate.home.search.guestsLabel}
                autoComplete="off"
              >
                {[1, 2, 3, 4].map((count) => (
                  <option value={count} key={count}>
                    {t(Translate.common.guest, { count })}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="button">
              {Translate.common.checkAvailability} <ArrowIcon />
            </button>
          </form>
        </div>
      </section>
      <section className="container section introduction-section">
        <div className="introduction-copy">
          <p className="eyebrow">{Translate.home.story.eyebrow}</p>
          <h2>
            {Translate.home.story.heading} <br />
            <span className="italic">{Translate.home.story.headingAccent}</span>
          </h2>
          <p>{storyIntroduction}</p>
          <Link href="/about" className="text-link">
            {Translate.home.story.link} <ArrowIcon />
          </Link>
          <div className="introduction-signature">
            <LeafIcon />
            <span>
              Katerina Studios <br />
              <small>{Translate.common.locationShort}</small>
            </span>
          </div>
        </div>
        <figure className="introduction-photo">
          <Photo photo={homeStoryPhoto} sizes="(max-width: 767px) 90vw, 55vw" />
          <figcaption>{Translate.home.story.caption}</figcaption>
        </figure>
      </section>
      <section className="studios-preview section">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{Translate.home.studios.eyebrow}</p>
              <h2>{Translate.home.studios.heading}</h2>
            </div>
            <div>
              <p>{Translate.home.studios.introduction}</p>
              <Link href="/studios" className="text-link">
                {Translate.home.hero.explore} <ArrowIcon />
              </Link>
            </div>
          </div>
          <div className="studio-editorial-grid">
            <Link href="/studios" className="studio-feature">
              <Photo id="studio-blue-bed" sizes="(max-width: 767px) 90vw, 60vw" />
              <div className="studio-feature-caption">
                <div>
                  <span className="eyebrow">{Translate.home.studios.inside}</span>
                  <h3>{Translate.home.studios.featureHeading}</h3>
                </div>
                <ArrowIcon />
              </div>
            </Link>
            <div className="studio-side">
              <Photo id="kitchenette" sizes="(max-width: 767px) 90vw, 30vw" />
              <div>
                <h3>{Translate.home.studios.detailsHeading}</h3>
                <p>{Translate.home.studios.detailsText}</p>
                {demo ? <p className="small muted">{Translate.home.studios.demoNote}</p> : null}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="container section balcony-section">
        <div className="balcony-photo">
          <Photo id="balcony-evening" sizes="(max-width: 767px) 100vw, 60vw" />
        </div>
        <div className="balcony-copy">
          <SeaIcon width={32} height={32} />
          <p className="eyebrow">{Translate.home.balcony.eyebrow}</p>
          <h2>
            {Translate.home.balcony.line1} <br />
            {Translate.home.balcony.line2} <br />
            <span className="italic">{Translate.home.balcony.line3}</span>
          </h2>
          <p>{Translate.home.balcony.text}</p>
          <Link href="/gallery" className="text-link">
            {Translate.home.balcony.link} <ArrowIcon />
          </Link>
        </div>
      </section>
      <section className="location-preview">
        <div className="container location-preview-inner">
          <div>
            <p className="eyebrow">
              <PinIcon width={16} height={16} /> {Translate.common.locationShort}
            </p>
            <h2>{Translate.home.location.heading}</h2>
            <p>{locationSummary}</p>
            <Link href="/location" className="text-link">
              {Translate.home.location.link} <ArrowIcon />
            </Link>
          </div>
          <Photo id="turquoise-bay" sizes="(max-width: 767px) 100vw, 55vw" />
        </div>
      </section>
      <Suspense fallback={null}>
        <HomepageReviewsSection />
      </Suspense>
      <PracticalInformation />
      <StayInvitation />
    </main>
  );
}
