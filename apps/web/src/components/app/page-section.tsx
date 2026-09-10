import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * A page region that is *not* a card.
 *
 * Cards are reserved for dense objects — tables, resource rows. Everything
 * lighter (settings groups, profile details, help topics) is a section: a
 * heading, a rule, and content. That difference in weight is what gives a page
 * a foreground and a background instead of a stack of equal boxes.
 */
export function PageSection({
  action,
  children,
  className,
  description,
  id,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  className?: string
  description?: ReactNode
  id?: string
  title: ReactNode
}) {
  return (
    <section className={cn("min-w-0", className)} id={id}>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-foreground">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="pt-4">{children}</div>
    </section>
  )
}

/**
 * Key/value rows. Replaces the cards that existed only to hold a handful of
 * labelled facts.
 */
export function InfoList({
  children,
  className,
  columns = 1,
}: {
  children: ReactNode
  className?: string
  columns?: 1 | 2
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-8",
        columns === 2 ? "sm:grid-cols-2" : undefined,
        className,
      )}
    >
      {children}
    </dl>
  )
}

export function InfoRow({
  label,
  mono = false,
  value,
}: {
  label: ReactNode
  mono?: boolean
  value: ReactNode
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right text-sm text-foreground",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  )
}
