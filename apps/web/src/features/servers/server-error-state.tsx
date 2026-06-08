import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ServerErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-destructive/30 bg-destructive/5 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-destructive/10 text-destructive">
        <AlertTriangle className="size-5" />
      </div>
      <h2 className="text-base font-medium">Unable to load servers</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{message}</p>
      <Button className="mt-5" onClick={onRetry} variant="outline">
        Retry
      </Button>
    </div>
  );
}
