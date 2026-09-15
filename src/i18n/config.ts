export const locales = ["en", "el", "de"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";
export const localeCookie = "ks_locale";
export const localeStorage = "ks-locale-v1";

export const localeDetails: Record<Locale, { name: string; intl: string; openGraph: string }> = {
  en: { name: "English", intl: "en-GB", openGraph: "en_GB" },
  el: { name: "Ελληνικά", intl: "el-GR", openGraph: "el_GR" },
  de: { name: "Deutsch", intl: "de-DE", openGraph: "de_DE" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}
