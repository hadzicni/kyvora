"use client"

import { useTranslations } from "next-intl"

import { StatusBadge } from "@/components/app/status-badge"
import type { ServerStatus } from "@/lib/api/servers"
import { statusTone } from "@/lib/tone"

export function ServerStatusBadge({ status }: { status: ServerStatus }) {
  const t = useTranslations("statuses")

  return <StatusBadge tone={statusTone(status)}>{t(status)}</StatusBadge>
}
