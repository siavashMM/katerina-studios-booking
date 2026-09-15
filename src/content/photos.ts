import metadata from "./photo-metadata.json";

export type PhotoCategory = "Balconies" | "Studios" | "Property" | "Surroundings";
export type PropertyPhoto = {
  id: string;
  sourceNumber: number;
  category: string;
  alt: string;
  width: number;
  height: number;
  variants: { src: string; width: number; height: number; bytes: number }[];
};

export const photos: PropertyPhoto[] = metadata;

export function getPhoto(id: string): PropertyPhoto {
  const photo = photos.find((item) => item.id === id);
  if (!photo) throw new Error(`Unknown property photo: ${id}`);
  return photo;
}

export const galleryCategories = [
  "All photos",
  "Balconies",
  "Studios",
  "Property",
  "Surroundings",
] as const;
