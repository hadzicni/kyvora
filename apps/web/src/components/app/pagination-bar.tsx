"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatNumber } from "@/features/servers/format"

/**
 * Shared pagination footer for list views. Every page now reports its range,
 * page-of-total and row size with the same wording and number formatting.
 */
export function PaginationBar({
  id,
  isFetching = false,
  note,
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  pageSizeOptions,
  totalElements,
  totalPages,
  visibleCount,
}: {
  id: string
  isFetching?: boolean
  note?: ReactNode
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  page: number
  pageSize: number
  pageSizeOptions: readonly number[]
  totalElements: number
  totalPages: number
  visibleCount: number
}) {
  const t = useTranslations()
  const locale = useLocale()

  const rangeStart = totalElements === 0 ? 0 : page * pageSize + 1
  const rangeEnd =
    totalElements === 0 ? 0 : Math.min(rangeStart + visibleCount - 1, totalElements)
  const canGoBack = page > 0 && !isFetching
  const canGoForward = totalPages > 0 && page + 1 < totalPages && !isFetching

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted-foreground tabular-nums">
        {t("actions.showingRange", {
          start: formatNumber(rangeStart, locale),
          end: formatNumber(rangeEnd, locale),
          total: formatNumber(totalElements, locale),
        })}
        {note ? <span className="ml-2 text-muted-foreground/70">{note}</span> : null}
        <span className="ml-2 text-muted-foreground/70">
          {t("actions.pageOf", {
            page: totalPages === 0 ? 0 : page + 1,
            total: totalPages,
          })}
          {isFetching ? ` · ${t("actions.updating")}` : ""}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <Label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={`${id}-page-size`}
        >
          {t("actions.rows")}
        </Label>
        <Select
          disabled={isFetching}
          onValueChange={(value) => onPageSizeChange(Number(value))}
          value={String(pageSize)}
        >
          <SelectTrigger
            aria-label={t("actions.rows")}
            className="h-7 w-24 text-xs"
            id={`${id}-page-size`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {t("actions.rowsCount", { count: size })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          aria-label={t("actions.previousPage")}
          disabled={!canGoBack}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          size="icon-sm"
          variant="outline"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          aria-label={t("actions.nextPage")}
          disabled={!canGoForward}
          onClick={() => onPageChange(page + 1)}
          size="icon-sm"
          variant="outline"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
