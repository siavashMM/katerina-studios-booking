import "server-only";
import { getEnv } from "@/config/env";
import { prisma } from "@/infrastructure/db/client";
import { mediaAssetToPhoto } from "./managed-content";

export async function getPublicProperty() {
  if (!getEnv().DATABASE_URL) return null;
  try {
    const property = await prisma.property.findUnique({
      where: { slug: "katerina-studios" },
      include: {
        content: true,
        accommodations: {
          where: { active: true },
          include: { media: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } },
          orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
        },
        media: {
          where: { accommodationId: null },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        },
      },
    });
    if (!property) return null;
    return {
      ...property,
      media: property.media.map((media) => ({ ...media, photo: mediaAssetToPhoto(media) })),
      accommodations: property.accommodations.map((accommodation) => ({
        ...accommodation,
        media: accommodation.media.map((media) => ({
          ...media,
          photo: mediaAssetToPhoto(media),
        })),
      })),
    };
  } catch {
    // Static content keeps the public site available if the optional CMS data cannot load.
    return null;
  }
}
