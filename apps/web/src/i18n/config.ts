export const supportedLocales = ["en", "de"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en";
export const localeStorageKey = "kyvora.locale";

export function isSupportedLocale(value: string | null): value is SupportedLocale {
  return value === "en" || value === "de";
}

