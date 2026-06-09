import deMessages from "./messages/de.json";
import enMessages from "./messages/en.json";
import type { SupportedLocale } from "./config";

type Messages = typeof enMessages;
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K];
};

function mergeMessages<T>(fallback: T, override: DeepPartial<T>): T {
  if (
    typeof fallback !== "object" ||
    fallback === null ||
    Array.isArray(fallback)
  ) {
    return (override ?? fallback) as T;
  }

  const result: Record<string, unknown> = { ...(fallback as Record<string, unknown>) };
  const overrideRecord = override as Record<string, unknown>;

  for (const key of Object.keys(overrideRecord)) {
    const fallbackValue = result[key];
    const overrideValue = overrideRecord[key];

    result[key] = mergeMessages(fallbackValue, overrideValue as never);
  }

  return result as T;
}

export const messagesByLocale: Record<SupportedLocale, Messages> = {
  en: enMessages,
  de: mergeMessages(enMessages, deMessages),
};
