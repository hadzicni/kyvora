"use client"

import { Search, X } from "lucide-react"
import { useTranslations } from "next-intl"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Shared filter bar for every list view. Keeps the panel chrome, field spacing
 * and reset affordance identical across servers, services, users and activity.
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
        "flex flex-col gap-3 rounded-lg border border-border bg-surface-subtle/40 p-3 lg:flex-row lg:flex-wrap lg:items-end",
        className,
      )}
    >
      {children}
      {onReset ? (
        <Button
          className="lg:ml-auto"
          disabled={resetDisabled}
          onClick={onReset}
          type="button"
          variant="outline"
        >
          <X className="size-4" />
          {t("actions.clear")}
        </Button>
      ) : null}
    </div>
  )
}

/** A single labelled control inside the toolbar. */
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
    <div className={cn("grid min-w-0 gap-1.5", className)}>
      <Label
        className="text-xs font-medium text-muted-foreground"
        htmlFor={htmlFor}
      >
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
