import type { ReactNode } from "react"

import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { type Tone, toneClass } from "@/lib/tone"
import { cn } from "@/lib/utils"

/**
 * Headline figures as one segmented strip rather than a row of floating cards.
 * Four separate cards compete with the panels below them; one strip divided by
 * rules reads as a single summary line.
 */
export function StatRow({ children }: { children: ReactNode }) {
  return (
    <Card className="gap-0 divide-y divide-border py-0 sm:grid sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 [&>*+*]:sm:border-l [&>*+*]:sm:border-border">
      {children}
    </Card>
  )
}

export function Stat({
  hint,
  icon: Icon,
  label,
  loading,
  tone = "neutral",
  value,
}: {
  hint?: ReactNode
  icon?: React.ComponentType<{ className?: string }>
  label: ReactNode
  loading?: boolean
  tone?: Tone
  value: ReactNode
}) {
  return (
    <div className={cn("min-w-0 px-4 py-4", toneClass(tone))}>
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon className="size-3.5 shrink-0 tone-text" /> : null}
        <span className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2.5 h-7 w-14" />
          <Skeleton className="mt-2 h-3.5 w-28" />
        </>
      ) : (
        <>
          <div className="mt-2 text-2xl font-semibold leading-none tracking-tight tabular-nums">
            {value}
          </div>
          {hint ? (
            <p className="mt-2 truncate text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </>
      )}
    </div>
  )
}
