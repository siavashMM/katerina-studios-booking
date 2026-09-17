import type { PropertyPhoto } from "@/content/photos";

export type ManagedMedia = {
  id: string;
  publicUrl: string;
  altText: string;
  width: number;
  height: number;
  accommodationId: string | null;
};

export function nonEmpty(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

export function mediaAssetToPhoto(media: ManagedMedia): PropertyPhoto {
  return {
    id: `managed-${media.id}`,
    sourceNumber: 0,
    category: media.accommodationId ? "Studios" : "Property",
    alt: media.altText,
    width: media.width,
    height: media.height,
    variants: [
      {
        src: media.publicUrl,
        width: media.width,
        height: media.height,
        bytes: 0,
      },
    ],
  };
}
