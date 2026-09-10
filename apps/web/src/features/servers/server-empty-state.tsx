"use client"

import { Server } from "lucide-react"
import { useTranslations } from "next-intl"

import { SectionState } from "@/components/app/section-state"

export function ServerEmptyState() {
  const t = useTranslations("servers")

  return (
    <SectionState
      description={t("emptyDescription")}
      icon={<Server className="size-5" />}
      title={t("emptyTitle")}
    />
  )
}
