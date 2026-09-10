"use client"

import { AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"

import { RetryButton, SectionState } from "@/components/app/section-state"

export function ServerErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const t = useTranslations()

  return (
    <SectionState
      action={<RetryButton label={t("actions.retry")} onRetry={onRetry} />}
      description={message}
      icon={<AlertTriangle className="size-5" />}
      title={t("servers.errorTitle")}
      tone="danger"
    />
  )
}
