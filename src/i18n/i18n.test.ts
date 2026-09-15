import { describe, expect, it } from "vitest";
import { formatLocaleCurrency, formatLocaleDate, getTranslations, translate } from "./core";

describe("translations", () => {
  it("loads complete, typed dictionaries for every locale", () => {
    expect(getTranslations("en").nav.home).toBe("Home");
    expect(getTranslations("de").nav.home).toBe("Startseite");
    expect(getTranslations("el").nav.home).toBe("Αρχική");
  });

  it("falls back to English for missing nested translations", () => {
    const Translate = getTranslations("de", { nav: { home: "Startseite" } });
    expect(Translate.nav.home).toBe("Startseite");
    expect(Translate.nav.gallery).toBe("Gallery");
  });

  it("interpolates values and applies locale plural rules", () => {
    expect(translate("de", getTranslations("de").common.guest, { count: 1 })).toBe("1 Gast");
    expect(translate("de", getTranslations("de").common.guest, { count: 2 })).toBe("2 Gäste");
    expect(
      translate("el", getTranslations("el").gallery.openPhoto, {
        number: 3,
        description: "Θέα στη θάλασσα",
      }),
    ).toBe("Άνοιγμα φωτογραφίας 3: Θέα στη θάλασσα");
  });

  it("formats dates and currency for the selected locale", () => {
    expect(formatLocaleDate("de", "2026-09-13")).toContain("Sept");
    expect(formatLocaleDate("el", "2026-09-13")).toContain("Σεπ");
    expect(formatLocaleCurrency("de", 12345)).toContain("123,45");
    expect(formatLocaleCurrency("en", 12345)).toContain("123.45");
  });
});
