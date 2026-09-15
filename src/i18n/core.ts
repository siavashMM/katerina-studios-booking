import de from "./messages/de";
import el from "./messages/el";
import en, { type Translation } from "./messages/en";
import { defaultLocale, localeDetails, type Locale } from "./config";

export type DeepPartial<T> = T extends readonly unknown[]
  ? T
  : T extends object
    ? { [Key in keyof T]?: DeepPartial<T[Key]> }
    : T;

export type PluralMessage = { one: string; other: string };
export type MessageValues = Record<string, string | number>;

const dictionaries: Record<Locale, Translation> = { en, el, de };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeWithFallback<T>(fallback: T, candidate?: DeepPartial<T>): T {
  if (candidate === undefined) return fallback;
  if (!isObject(fallback) || !isObject(candidate)) return candidate as T;

  const result: Record<string, unknown> = { ...fallback };
  for (const key of Object.keys(fallback)) {
    const fallbackValue = (fallback as Record<string, unknown>)[key];
    const candidateValue = candidate[key] as DeepPartial<typeof fallbackValue> | undefined;
    result[key] = mergeWithFallback(fallbackValue, candidateValue);
  }
  return result as T;
}

export function getTranslations(
  locale: Locale = defaultLocale,
  candidate: DeepPartial<Translation> = dictionaries[locale],
): Translation {
  return mergeWithFallback<Translation>(en, candidate);
}

function interpolate(message: string, values: MessageValues): string {
  return message.replace(/\{(\w+)\}/g, (match, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : match,
  );
}

export function translate(
  locale: Locale,
  message: string | PluralMessage,
  values: MessageValues = {},
): string {
  const template =
    typeof message === "string"
      ? message
      : message[
          new Intl.PluralRules(localeDetails[locale].intl).select(Number(values.count)) === "one"
            ? "one"
            : "other"
        ];
  return interpolate(template, values);
}

export function formatLocaleDate(
  locale: Locale,
  value: string | Date,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  },
): string {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : value;
  return new Intl.DateTimeFormat(localeDetails[locale].intl, options).format(date);
}

export function formatLocaleNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(localeDetails[locale].intl, options).format(value);
}

export function formatLocaleCurrency(locale: Locale, cents: number, currency = "EUR"): string {
  return formatLocaleNumber(locale, cents / 100, { style: "currency", currency });
}
