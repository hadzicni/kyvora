"use client"

import { Cable } from "lucide-react"
import { useTranslations } from "next-intl"

import { SectionState } from "@/components/app/section-state"

export function ServiceEmptyState() {
  const t = useTranslations("services")

  return (
    <SectionState
      description={t("emptyDescription")}
      icon={<Cable className="size-5" />}
      title={t("emptyTitle")}
    />
  )
}
