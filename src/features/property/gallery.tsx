"use client";

import { useRef, useState } from "react";
import { Button, Dialog, Heading, Modal, ModalOverlay } from "react-aria-components";
import { ArrowIcon, CloseIcon, PlusIcon } from "@/components/ui/icons";
import { photos, type PropertyPhoto } from "@/content/photos";
import { useTranslation } from "@/i18n/client";
import { Photo } from "./photo";

const categoryOptions = [
  { value: "All photos", label: "all" },
  { value: "Balconies", label: "balconies" },
  { value: "Studios", label: "studios" },
  { value: "Property", label: "property" },
  { value: "Surroundings", label: "surroundings" },
] as const;

export function Gallery({ selection }: { selection?: PropertyPhoto[] }) {
  const { Translate, t } = useTranslation();
  const [category, setCategory] = useState<string>("All photos");
  const [active, setActive] = useState<number | null>(null);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const source = selection ?? photos;
  const shown =
    category === "All photos" ? source : source.filter((photo) => photo.category === category);
  const current = active === null ? null : shown[active];
  function move(amount: number) {
    setActive((index) => (index === null ? null : (index + amount + shown.length) % shown.length));
  }

  return (
    <>
      {!selection ? (
        <div className="gallery-filter-row">
          <div className="gallery-filters" aria-label={Translate.gallery.filterLabel}>
            {categoryOptions.map(({ value, label }) => (
              <Button
                key={value}
                aria-pressed={category === value}
                className="gallery-filter"
                onPress={() => {
                  setCategory(value);
                  setActive(null);
                }}
              >
                {Translate.photoCategories[label]}
              </Button>
            ))}
          </div>
          <span className="photo-count" aria-live="polite">
            {t(Translate.gallery.count, { count: shown.length })}
          </span>
        </div>
      ) : null}
      <div className={selection ? "gallery-grid gallery-selection" : "gallery-grid"}>
        {shown.map((photo, index) => (
          <figure
            key={photo.id}
            className={`gallery-item ${photo.height > photo.width ? "gallery-item-portrait" : ""}`}
          >
            <Button
              className="gallery-open"
              onPress={() => setActive(index)}
              aria-label={t(Translate.gallery.openPhoto, {
                number: index + 1,
                description:
                  Translate.photos[photo.id as keyof typeof Translate.photos] ?? photo.alt,
              })}
            >
              <Photo
                photo={photo}
                sizes="(max-width: 599px) 90vw, (max-width: 1023px) 44vw, 30vw"
              />
              <span className="gallery-expand" aria-hidden="true">
                <PlusIcon />
              </span>
            </Button>
            <figcaption>
              <span>
                {
                  Translate.photoCategories[
                    categoryOptions.find((item) => item.value === photo.category)?.label ??
                      "property"
                  ]
                }
              </span>
              <span>{String(index + 1).padStart(2, "0")}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <ModalOverlay
        className="gallery-overlay"
        isOpen={active !== null}
        onOpenChange={(open) => {
          if (!open) setActive(null);
        }}
        isDismissable
      >
        <Modal className="gallery-modal">
          <Dialog className="gallery-dialog" aria-label={Translate.gallery.viewer}>
            <div
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  move(1);
                }
                if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  move(-1);
                }
              }}
            >
              <div className="gallery-dialog-header">
                <Heading slot="title">Katerina Studios</Heading>
                <Button
                  className="icon-button"
                  autoFocus
                  aria-label={Translate.gallery.close}
                  onPress={() => setActive(null)}
                >
                  <CloseIcon />
                </Button>
              </div>
              {current ? (
                <div
                  className="gallery-image-stage"
                  onPointerDown={(event) => {
                    if (event.pointerType === "touch")
                      gesture.current = { x: event.clientX, y: event.clientY };
                  }}
                  onPointerUp={(event) => {
                    if (!gesture.current) return;
                    const dx = event.clientX - gesture.current.x;
                    const dy = event.clientY - gesture.current.y;
                    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5)
                      move(dx < 0 ? 1 : -1);
                    gesture.current = null;
                  }}
                  onPointerCancel={() => {
                    gesture.current = null;
                  }}
                >
                  <Photo
                    key={current.id}
                    photo={current}
                    sizes="(max-width: 767px) 100vw, 85vw"
                    priority
                  />
                </div>
              ) : null}
              <div className="gallery-dialog-footer">
                <Button
                  className="icon-button gallery-previous"
                  aria-label={Translate.gallery.previous}
                  onPress={() => move(-1)}
                >
                  <ArrowIcon />
                </Button>
                <div aria-live="polite" aria-atomic="true">
                  <p>
                    {current
                      ? (Translate.photos[current.id as keyof typeof Translate.photos] ??
                        current.alt)
                      : ""}
                  </p>
                  <span>{active === null ? "" : `${active + 1} / ${shown.length}`}</span>
                </div>
                <Button
                  className="icon-button"
                  aria-label={Translate.gallery.next}
                  onPress={() => move(1)}
                >
                  <ArrowIcon />
                </Button>
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}
