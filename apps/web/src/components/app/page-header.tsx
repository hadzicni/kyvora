import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Every page opens the same way: optional eyebrow, title, optional meta badge,
 * subtitle, and right-aligned actions.
 */
export function PageHeader({
  actions,
  badge,
  className,
  eyebrow,
  subtitle,
  title,
}: {
  actions?: ReactNode
  badge?: ReactNode
  className?: string
  eyebrow?: ReactNode
  subtitle?: ReactNode
  title: ReactNode
}) {
  return (
    <div
      className={cn(
        // The rule anchors the title and marks where the page content starts.
        "flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="wrap-break-word text-xl font-semibold tracking-tight">{title}</h1>
          {badge}
        </div>
        {subtitle ? (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

/** Record-count pill shown next to a page title. */
export function PageHeaderCount({ children }: { children: ReactNode }) {
  return (
    <Badge className="font-normal text-muted-foreground" variant="outline">
      {children}
    </Badge>
  )
}

/** Breadcrumb-style link back to a detail page's list view. */
export function PageHeaderBackLink({
  children,
  href,
}: {
  children: ReactNode
  href: string
}) {
  return (
    <Link
      className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      href={href}
    >
      <ArrowLeft aria-hidden="true" className="size-3.5" />
      {children}
    </Link>
  )
}
