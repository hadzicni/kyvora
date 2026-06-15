"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react";

import type { NotificationSeverity } from "@/features/notifications/types/notification";
import { cn } from "@/lib/utils";

const severityLabels: Record<NotificationSeverity, string> = {
  INFO: "Info",
  SUCCESS: "Success",
  WARNING: "Warning",
  ERROR: "Error",
  CRITICAL: "Critical",
};

const severityClasses: Record<NotificationSeverity, string> = {
  INFO: "border-sky-400/25 bg-sky-400/10 text-sky-300",
  SUCCESS: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  WARNING: "border-amber-400/25 bg-amber-400/10 text-amber-300",
  ERROR: "border-rose-400/25 bg-rose-400/10 text-rose-300",
  CRITICAL: "border-red-400/35 bg-red-400/15 text-red-200",
};

const severityIcons: Record<NotificationSeverity, LucideIcon> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  ERROR: CircleAlert,
  CRITICAL: OctagonAlert,
};

export function NotificationSeverityBadge({
  severity,
}: {
  severity: NotificationSeverity;
}) {
  const Icon = severityIcons[severity];

  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full border px-2 text-[11px] font-medium",
        severityClasses[severity]
      )}
    >
      <Icon className="size-3" />
      {severityLabels[severity]}
    </span>
  );
}

export function NotificationSeverityIcon({
  severity,
  className,
}: {
  severity: NotificationSeverity;
  className?: string;
}) {
  const Icon = severityIcons[severity];

  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md border",
        severityClasses[severity],
        className
      )}
      aria-hidden="true"
    >
      <Icon className="size-4" />
    </span>
  );
}
