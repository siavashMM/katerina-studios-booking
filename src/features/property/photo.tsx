"use client";

/* eslint-disable @next/next/no-img-element -- The gallery uses prepared image derivatives with explicit sizes. */
import { getPhoto, type PropertyPhoto } from "@/content/photos";
import { useTranslation } from "@/i18n/client";

type PhotoProps = {
  id?: string;
  photo?: PropertyPhoto;
  className?: string;
  sizes?: string;
  priority?: boolean;
  alt?: string;
};

export function Photo({
  id,
  photo: supplied,
  className,
  sizes = "(max-width: 767px) 100vw, 50vw",
  priority = false,
  alt,
}: PhotoProps) {
  const { Translate } = useTranslation();
  const photo = supplied ?? getPhoto(id!);
  const largest = photo.variants.at(-1)!;
  const translatedAlt = Translate.photos[photo.id as keyof typeof Translate.photos];
  // Static derivatives avoid an image server and remain portable between Docker hosts.
  return (
    <img
      className={className}
      src={largest.src}
      srcSet={photo.variants.map((variant) => `${variant.src} ${variant.width}w`).join(", ")}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={alt ?? translatedAlt ?? photo.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
