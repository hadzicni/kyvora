import { type Tone, toneClass } from "@/lib/tone"
import { cn } from "@/lib/utils"

export type HealthSegment = {
  label: string
  tone: Tone
  value: number
}

/** Proportional status bar shared by every health summary in the product. */
export function HealthBar({
  segments,
  total,
}: {
  segments: HealthSegment[]
  total: number
}) {
  if (total <= 0) {
    return <div className="h-1.5 rounded-full bg-muted" />
  }

  return (
    <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-muted">
      {segments.map((segment) => {
        const width = Math.max(0, (segment.value / total) * 100)
        if (width === 0) return null

        return (
          <div
            aria-label={`${segment.label}: ${segment.value}`}
            className={cn("min-w-1 tone-fill", toneClass(segment.tone))}
            key={segment.label}
            style={{ width: `${width}%` }}
          />
        )
      })}
    </div>
  )
}
