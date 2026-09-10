"use client"

import { Clipboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * A shell command the operator is expected to copy. Used by the agent enrol and
 * remove flows so both render terminal snippets identically.
 */
export function CodeCommand({
  copyLabel,
  onCopy,
  value,
}: {
  copyLabel: string
  onCopy: (value: string) => void
  value: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-subtle p-2">
      <code
        className={cn(
          "min-w-0 flex-1 overflow-x-auto p-1 font-mono text-xs text-foreground",
        )}
      >
        {value}
      </code>
      <Button
        aria-label={copyLabel}
        className="shrink-0"
        onClick={() => void onCopy(value)}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Clipboard className="size-4" />
      </Button>
    </div>
  )
}
