"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  formatLocaleCurrency,
  formatLocaleDate,
  formatLocaleNumber,
  getTranslations,
  translate,
  type MessageValues,
  type PluralMessage,
} from "./core";
import { defaultLocale, localeCookie, localeDetails, localeStorage, type Locale } from "./config";

type I18nContextValue = {
  locale: Locale;
  intlLocale: string;
  Translate: ReturnType<typeof getTranslations>;
  setLocale: (locale: Locale) => void;
  t: (message: string | PluralMessage, values?: MessageValues) => string;
  formatDate: (value: string | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (cents: number, currency?: string) => string;
};

const defaultTranslate = getTranslations(defaultLocale);
const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  intlLocale: localeDetails[defaultLocale].intl,
  Translate: defaultTranslate,
  setLocale: () => undefined,
  t: (message, values) => translate(defaultLocale, message, values),
  formatDate: (value, options) => formatLocaleDate(defaultLocale, value, options),
  formatNumber: (value, options) => formatLocaleNumber(defaultLocale, value, options),
  formatCurrency: (cents, currency) => formatLocaleCurrency(defaultLocale, cents, currency),
});

function storeLocale(locale: Locale): void {
  try {
    localStorage.setItem(localeStorage, locale);
  } catch {
    // The cookie still persists the preference when local storage is unavailable.
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${localeCookie}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function TranslationProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState(initialLocale);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      setLocaleState(nextLocale);
      document.documentElement.lang = nextLocale;
      storeLocale(nextLocale);
      startTransition(() => router.refresh());
    },
    [router],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    storeLocale(locale);
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const Translate = getTranslations(locale);
    return {
      locale,
      intlLocale: localeDetails[locale].intl,
      Translate,
      setLocale,
      t: (message, values) => translate(locale, message, values),
      formatDate: (date, options) => formatLocaleDate(locale, date, options),
      formatNumber: (number, options) => formatLocaleNumber(locale, number, options),
      formatCurrency: (cents, currency) => formatLocaleCurrency(locale, cents, currency),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}
