import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { type Tone, toneClass } from "@/lib/tone"
import { cn } from "@/lib/utils"

/**
 * The one empty / error / not-found surface in the product.
 *
 * Every feature renders its blank and failure states through this component so
 * they share the same height, icon treatment, type scale and action placement.
 */
export function SectionState({
  action,
  className,
  description,
  icon,
  size = "default",
  title,
  tone = "neutral",
}: {
  action?: ReactNode
  className?: string
  description?: ReactNode
  icon: ReactNode
  size?: "default" | "sm"
  title: ReactNode
  tone?: Tone
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-subtle/40 px-6 text-center",
        size === "sm" ? "min-h-44 py-8" : "min-h-64 py-12",
        // A toned state tints its own frame, but the copy and action stay neutral.
        tone !== "neutral" && cn("border-solid tone-surface", toneClass(tone)),
        className,
      )}
    >
      <div
        className={cn(
          "mb-4 flex items-center justify-center rounded-xl border",
          size === "sm" ? "size-10" : "size-12",
          tone === "neutral"
            ? "border-border bg-muted text-muted-foreground"
            : cn("tone-surface tone-text", toneClass(tone)),
        )}
      >
        {icon}
      </div>
      <h2 className="text-sm font-medium text-foreground">{title}</h2>
      {description ? (
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function RetryButton({
  label = "Retry",
  onRetry,
}: {
  label?: string
  onRetry: () => void
}) {
  return (
    <Button onClick={onRetry} variant="outline">
      {label}
    </Button>
  )
}
