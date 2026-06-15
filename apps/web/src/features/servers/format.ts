import type { useFormatter, useTranslations } from "next-intl";

export function formatDateTime(
  value: string | null | undefined,
  locale = "en"
) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatNumber(value: number, locale = "en") {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatRelativeLastSeen(
  value: string | null,
  format: ReturnType<typeof useFormatter>,
  t: ReturnType<typeof useTranslations>
) {
  if (!value) {
    return t("common.never");
  }

  const elapsedMs = Date.now() - new Date(value).getTime();
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60_000));

  if (elapsedMinutes < 1) {
    return t("common.justNow");
  }

  return format.relativeTime(new Date(value), new Date());
}

export function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  const units = ["B", "KiB", "MiB", "GiB", "TiB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size = size / 1024;
    unitIndex += 1;
  }

  const digits = unitIndex === 0 || size >= 10 ? 0 : 1;
  return `${size.toFixed(digits)} ${units[unitIndex]}`;
}

export function formatUptime(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Unknown";
  }

  const days = Math.floor(value / 86_400);
  const hours = Math.floor((value % 86_400) / 3_600);
  const minutes = Math.floor((value % 3_600) / 60);
  const parts: string[] = [];

  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0 || days > 0) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes}m`);

  return parts.join(" ");
}
