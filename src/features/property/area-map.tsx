"use client";

import { useState } from "react";
import { ArrowIcon } from "@/components/ui/icons";
import { useTranslation } from "@/i18n/client";

type Coordinates = readonly [latitude: number, longitude: number];
type TravelMode = "driving" | "walking";

const googleMapsEmbedApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;

const studio = {
  name: "Katerina Studios",
  coordinates: [39.67701, 19.711495] as Coordinates,
};

const places = [
  {
    id: "agia-triada",
    number: "01",
    coordinates: [39.6733187, 19.7150017] as Coordinates,
    travelMode: "walking" as TravelMode,
  },
  {
    id: "paleokastritsa-monastery",
    number: "02",
    coordinates: [39.6694747, 19.7014911] as Coordinates,
    travelMode: "driving" as TravelMode,
  },
  {
    id: "bella-vista",
    number: "03",
    coordinates: [39.6794487, 19.699819] as Coordinates,
    travelMode: "driving" as TravelMode,
  },
  {
    id: "angelokastro",
    number: "04",
    coordinates: [39.6782656, 19.6865807] as Coordinates,
    travelMode: "driving" as TravelMode,
  },
] as const;

type Place = (typeof places)[number];

function coordinateString(coordinates: Coordinates): string {
  return coordinates.join(",");
}

function directionsUrl(destination: Place): string {
  const query = new URLSearchParams({
    api: "1",
    origin: coordinateString(studio.coordinates),
    destination: coordinateString(destination.coordinates),
    travelmode: destination.travelMode,
  });
  return `https://www.google.com/maps/dir/?${query.toString()}`;
}

function embedUrl(apiKey: string, destination: Place, language: string): string {
  const query = new URLSearchParams({
    key: apiKey,
    origin: coordinateString(studio.coordinates),
    destination: coordinateString(destination.coordinates),
    mode: destination.travelMode,
    language,
    region: "GR",
  });
  return `https://www.google.com/maps/embed/v1/directions?${query.toString()}`;
}

export function AreaMap() {
  const { locale, Translate, t } = useTranslation();
  const [selectedId, setSelectedId] = useState<Place["id"]>(places[0].id);
  const [mapReady, setMapReady] = useState(false);
  const selected = places.find((place) => place.id === selectedId) ?? places[0];
  const selectedCopy = Translate.location.guide.entries[selected.id];

  function selectPlace(place: Place): void {
    if (place.id === selectedId) return;
    setMapReady(false);
    setSelectedId(place.id);
  }

  return (
    <section className="container section area-guide" aria-labelledby="area-guide-title">
      <div className="area-guide-intro">
        <div>
          <p className="eyebrow">{Translate.location.guide.eyebrow}</p>
          <h2 id="area-guide-title">
            {Translate.location.guide.heading}
            <br />
            <span className="italic">{Translate.location.guide.headingAccent}</span>
          </h2>
        </div>
        <p>{Translate.location.guide.introduction}</p>
      </div>

      <div className="area-map-explorer">
        <div className="area-map-guide">
          <div className="area-map-selection" aria-live="polite">
            <p className="area-map-count">
              {selected.number} <span>/ {String(places.length).padStart(2, "0")}</span>
            </p>
            <p className="eyebrow">{selectedCopy.category}</p>
            <h3>{selectedCopy.name}</h3>
            <p>{selectedCopy.description}</p>
            <dl>
              <div>
                <dt>{Translate.location.guide.position}</dt>
                <dd>{selectedCopy.journey}</dd>
              </div>
              <div>
                <dt>{Translate.location.guide.planFor}</dt>
                <dd>{selectedCopy.mode}</dd>
              </div>
            </dl>
            <a
              className="area-map-route"
              href={directionsUrl(selected)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {Translate.location.guide.directions} <ArrowIcon />
              <span className="sr-only">
                {t(Translate.location.guide.directionsLabel, { name: selectedCopy.name })}
              </span>
            </a>
          </div>

          <nav className="area-place-list" aria-label={Translate.location.guide.placesLabel}>
            {places.map((place) => {
              const copy = Translate.location.guide.entries[place.id];
              return (
                <button
                  key={place.id}
                  type="button"
                  className="area-place-button"
                  aria-pressed={place.id === selectedId}
                  onClick={() => selectPlace(place)}
                >
                  <span>{place.number}</span>
                  <span>
                    <small>{copy.category}</small>
                    {copy.name}
                  </span>
                  <ArrowIcon />
                </button>
              );
            })}
          </nav>
        </div>

        <div className="area-map-frame">
          {googleMapsEmbedApiKey ? (
            <iframe
              key={selected.id}
              className="area-map-canvas"
              title={`${Translate.location.guide.mapLabel}: ${studio.name} — ${selectedCopy.name}`}
              src={embedUrl(googleMapsEmbedApiKey, selected, locale)}
              loading="lazy"
              allowFullScreen
              aria-describedby="area-map-note"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={() => setMapReady(true)}
            />
          ) : (
            <p className="area-map-status area-map-status-error" role="alert">
              {Translate.location.guide.unavailable}
            </p>
          )}
          {googleMapsEmbedApiKey && !mapReady ? (
            <p className="area-map-status" role="status">
              {Translate.location.guide.loading}
            </p>
          ) : null}
        </div>
      </div>

      <p className="area-map-note small" id="area-map-note">
        {Translate.location.guide.note}
      </p>
    </section>
  );
}
