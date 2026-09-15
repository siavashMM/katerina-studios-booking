import "server-only";

import { cookies } from "next/headers";
import {
  formatLocaleCurrency,
  formatLocaleDate,
  formatLocaleNumber,
  getTranslations,
  translate,
  type MessageValues,
  type PluralMessage,
} from "./core";
import { defaultLocale, isLocale, localeCookie, localeDetails, type Locale } from "./config";

export async function getServerLocale(): Promise<Locale> {
  const value = (await cookies()).get(localeCookie)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getServerTranslation() {
  const locale = await getServerLocale();
  return {
    locale,
    intlLocale: localeDetails[locale].intl,
    Translate: getTranslations(locale),
    t: (message: string | PluralMessage, values?: MessageValues) =>
      translate(locale, message, values),
    formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) =>
      formatLocaleDate(locale, value, options),
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) =>
      formatLocaleNumber(locale, value, options),
    formatCurrency: (cents: number, currency?: string) =>
      formatLocaleCurrency(locale, cents, currency),
  };
}
