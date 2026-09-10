import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Two-column layout for resource detail pages: the record itself on the left,
 * status and actions in a narrow rail on the right. Replaces the single stack
 * of equal-weight cards, which gave the eye nowhere to land.
 */
export function DetailLayout({
  aside,
  children,
  className,
}: {
  aside: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]",
        className,
      )}
    >
      <div className="min-w-0 space-y-6">{children}</div>
      <aside className="min-w-0 space-y-6 lg:sticky lg:top-20">{aside}</aside>
    </div>
  )
}
