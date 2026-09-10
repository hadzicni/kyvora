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
 * ruled header, content below. Replaces the per-page Card assemblies that had
 * drifted apart on borders, padding and title weight.
 */
export function SectionCard({
  action,
  children,
  className,
  contentClassName,
  description,
  icon,
  title,
}: {
  action?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  description?: ReactNode
  icon?: ReactNode
  title: ReactNode
}) {
  return (
    <Card className={className}>
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          {icon ? (
            <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>
          ) : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <div className="col-start-2 row-span-2 row-start-1 self-start justify-self-end">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn("pt-4", contentClassName)}>{children}</CardContent>
    </Card>
  )
}
