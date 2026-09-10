"use client"

import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Shared filter row for every list view. It is a band inside the list card,
 * not a panel of its own, so a list reads as one frame rather than a box in a
 * box.
 */
export function DataToolbar({
  children,
  className,
  onReset,
  resetDisabled = false,
}: {
  children: ReactNode
  className?: string
  onReset?: () => void
  resetDisabled?: boolean
}) {
  const t = useTranslations()

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:flex-wrap lg:items-center",
        className,
      )}
    >
      {children}
      {onReset ? (
        <Button
          className="lg:ml-auto"
          disabled={resetDisabled}
          onClick={onReset}
          size="sm"
          type="button"
          variant="ghost"
        >
          <X className="size-4" />
          {t("actions.clear")}
        </Button>
      ) : null}
    </div>
  )
}

/**
 * A single control in the toolbar. The label is visually hidden by default so
 * the row stays one line tall; screen readers still get it.
 */
export function ToolbarField({
  children,
  className,
  htmlFor,
  label,
}: {
  children: ReactNode
  className?: string
  htmlFor: string
  label: ReactNode
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <Label className="sr-only" htmlFor={htmlFor}>
        {label}
      </Label>
      {children}
    </div>
  )
}

/** Search input with the leading magnifier every list view uses. */
export function ToolbarSearch({
  id,
  onChange,
  placeholder,
  value,
}: {
  id: string
  onChange: (value: string) => void
  placeholder?: string
  value: string
}) {
  return (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        className="pl-8"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  )
}
