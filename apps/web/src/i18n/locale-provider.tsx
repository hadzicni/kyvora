"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { IntlErrorCode, NextIntlClientProvider } from "next-intl";

import {
  defaultLocale,
  isSupportedLocale,
  localeStorageKey,
  type SupportedLocale,
} from "./config";
import { messagesByLocale } from "./messages";

type LocalePreferenceContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

const LocalePreferenceContext =
  createContext<LocalePreferenceContextValue | null>(null);

function readStoredLocale(): SupportedLocale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  try {
    const storedLocale = window.localStorage.getItem(localeStorageKey);
    return isSupportedLocale(storedLocale) ? storedLocale : defaultLocale;
  } catch {
    return defaultLocale;
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(readStoredLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocalePreferenceContextValue>(
    () => ({
      locale,
      setLocale: (nextLocale) => {
        const normalizedLocale = isSupportedLocale(nextLocale)
          ? nextLocale
          : defaultLocale;

        setLocaleState(normalizedLocale);

        try {
          window.localStorage.setItem(localeStorageKey, normalizedLocale);
        } catch {
          // The selected locale still applies for the current tab.
        }
      },
    }),
    [locale]
  );

  return (
    <LocalePreferenceContext.Provider value={value}>
      <NextIntlClientProvider
        key={locale}
        locale={locale}
        messages={messagesByLocale[locale]}
        onError={(error) => {
          if (
            error.code === IntlErrorCode.MISSING_MESSAGE ||
            error.code === IntlErrorCode.MISSING_FORMAT
          ) {
            return;
          }

          throw error;
        }}
        getMessageFallback={({ key }) => key}
      >
        {children}
      </NextIntlClientProvider>
    </LocalePreferenceContext.Provider>
  );
}

export function useLocalePreference() {
  const context = useContext(LocalePreferenceContext);

  if (!context) {
    throw new Error("useLocalePreference must be used within LocaleProvider");
  }

  return context;
}
