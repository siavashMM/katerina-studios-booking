import type { PropertyPhoto } from "./photos";

export const homeStoryPhoto: PropertyPhoto = {
  id: "home-story",
  sourceNumber: 21,
  category: "Property",
  alt: "Katerina Studios with yellow trim, green doors, flowers, and a view of the sea.",
  width: 1672,
  height: 941,
  variants: [
    {
      src: "/images/home-story-640.webp",
      width: 640,
      height: 360,
      bytes: 65276,
    },
    {
      src: "/images/home-story-960.webp",
      width: 960,
      height: 540,
      bytes: 123428,
    },
    {
      src: "/images/home-story-1440.webp",
      width: 1440,
      height: 810,
      bytes: 223538,
    },
  ],
};
