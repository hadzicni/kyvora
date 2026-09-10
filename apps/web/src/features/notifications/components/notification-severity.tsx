"use client"

import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Info,
  OctagonAlert,
  type LucideIcon,
} from "lucide-react"

import { StatusBadge } from "@/components/app/status-badge"
import type { NotificationSeverity } from "@/features/notifications/types/notification"
import { type Tone, toneClass } from "@/lib/tone"
import { cn } from "@/lib/utils"

const severityLabels: Record<NotificationSeverity, string> = {
  CRITICAL: "Critical",
  ERROR: "Error",
  INFO: "Info",
  SUCCESS: "Success",
  WARNING: "Warning",
}

const severityTones: Record<NotificationSeverity, Tone> = {
  CRITICAL: "danger",
  ERROR: "danger",
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
}

const severityIcons: Record<NotificationSeverity, LucideIcon> = {
  CRITICAL: OctagonAlert,
  ERROR: CircleAlert,
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
}

export function NotificationSeverityBadge({
  severity,
}: {
  severity: NotificationSeverity
}) {
  const Icon = severityIcons[severity]

  return (
    <StatusBadge icon={<Icon />} tone={severityTones[severity]}>
      {severityLabels[severity]}
    </StatusBadge>
  )
}

export function NotificationSeverityIcon({
  className,
  severity,
}: {
  className?: string
  severity: NotificationSeverity
}) {
  const Icon = severityIcons[severity]

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border tone-surface tone-text",
        toneClass(severityTones[severity]),
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  )
}
