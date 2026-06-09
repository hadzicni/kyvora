import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SectionState({
  action,
  className,
  description,
  icon,
  title,
  tone = "muted",
}: {
  action?: ReactNode;
  className?: string;
  description: ReactNode;
  icon: ReactNode;
  title: ReactNode;
  tone?: "muted" | "destructive";
}) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center",
        tone === "destructive" && "border-destructive/30 bg-destructive/5",
        className
      )}
    >
      <div
        className={cn(
          "mb-4 flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground",
          tone === "destructive" && "bg-destructive/10 text-destructive"
        )}
      >
        {icon}
      </div>
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function RetryButton({ onRetry }: { onRetry: () => void }) {
  return (
    <Button onClick={onRetry} variant="outline">
      Retry
    </Button>
  );
}
