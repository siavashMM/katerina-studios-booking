import { describe, expect, it } from "vitest";
import { ratingLabel } from "./reviews";

describe("review accessibility text", () => {
  it("labels the property rating with its source", () => {
    expect(ratingLabel(4.9, "Google")).toBe("Google rating: 4.9 out of 5.");
  });

  it("labels an individual star rating", () => {
    expect(ratingLabel(5)).toBe("5 out of 5 stars.");
  });
});
