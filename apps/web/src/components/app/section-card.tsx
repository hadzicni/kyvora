import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * The standard panel used across the product: icon + title + description in a
 * ruled header, content below.
 *
 * `flush` removes the content padding so a list card can render edge-to-edge
 * bands — toolbar, table, footer — separated by rules instead of nested boxes.
 * Pad individual bands with `SectionCardBand`.
 */
export function SectionCard({
  action,
  children,
  className,
  contentClassName,
  description,
  flush = false,
  icon,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  description?: ReactNode
  flush?: boolean
  icon?: ReactNode
  title: ReactNode
}) {
  return (
    <Card className={cn(flush && "gap-0 pb-0", className)}>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          {icon ? (
            <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>
          ) : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? (
          <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">
            {action}
          </div>
        ) : null}
      </CardHeader>
      <CardContent
        className={cn(flush ? "px-0" : "pt-4", contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  )
}

/** A padded, optionally ruled strip inside a `flush` SectionCard. */
export function SectionCardBand({
  children,
  className,
  divider,
}: {
  children: ReactNode
  className?: string
  divider?: "top" | "bottom"
}) {
  return (
    <div
      className={cn(
        "px-4 py-3",
        divider === "top" && "border-t border-border",
        divider === "bottom" && "border-b border-border",
        className,
      )}
    >
      {children}
    </div>
  )
}
