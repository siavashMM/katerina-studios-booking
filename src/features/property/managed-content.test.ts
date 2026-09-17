import { describe, expect, it } from "vitest";
import { mediaAssetToPhoto, nonEmpty } from "./managed-content";

describe("managed public content", () => {
  it("uses only non-empty owner text", () => {
    expect(nonEmpty("  A family welcome.  ", "Fallback")).toBe("A family welcome.");
    expect(nonEmpty("   ", "Fallback")).toBe("Fallback");
  });

  it("maps an owner photo to the public gallery format", () => {
    expect(
      mediaAssetToPhoto({
        id: "photo-id",
        publicUrl: "/owner-uploads/photo.webp",
        altText: "A balcony above the bay",
        width: 1800,
        height: 1200,
        accommodationId: null,
      }),
    ).toEqual({
      id: "managed-photo-id",
      sourceNumber: 0,
      category: "Property",
      alt: "A balcony above the bay",
      width: 1800,
      height: 1200,
      variants: [
        {
          src: "/owner-uploads/photo.webp",
          width: 1800,
          height: 1200,
          bytes: 0,
        },
      ],
    });
  });
});
