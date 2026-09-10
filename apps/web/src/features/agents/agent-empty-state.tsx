"use client"

import { Bot } from "lucide-react"
import { useTranslations } from "next-intl"

import { SectionState } from "@/components/app/section-state"

export function AgentEmptyState() {
  const t = useTranslations("agents")

  return (
    <SectionState
      description={t("emptyDescription")}
      icon={<Bot className="size-5" />}
      title={t("emptyTitle")}
    />
  )
}
