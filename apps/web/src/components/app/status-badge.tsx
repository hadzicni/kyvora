import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { type Tone, toneClass } from "@/lib/tone"
import { cn } from "@/lib/utils"

/**
 * The single badge used for every status-like value in the product.
 * Callers pick a semantic tone; the visual recipe lives in one place.
 */
export function StatusBadge({
  children,
  className,
  icon,
  tone,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
  tone: Tone
}) {
  return (
    <Badge
      className={cn("border tone-surface tone-text", toneClass(tone), className)}
      variant="outline"
    >
      {icon}
      {children}
    </Badge>
  )
}

/** Compact tone dot for dense rows where a full badge would be too heavy. */
export function StatusDot({ className, tone }: { className?: string; tone: Tone }) {
  return (
    <span
      aria-hidden="true"
      className={cn("size-1.5 shrink-0 rounded-full tone-fill", toneClass(tone), className)}
    />
  )
}
