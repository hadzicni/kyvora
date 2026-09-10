"use client"

import { useTranslations } from "next-intl"

import { StatusBadge } from "@/components/app/status-badge"
import type { AgentStatus } from "@/lib/api/agents"
import { statusTone } from "@/lib/tone"

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const t = useTranslations("statuses")

  return <StatusBadge tone={statusTone(status)}>{t(status)}</StatusBadge>
}
