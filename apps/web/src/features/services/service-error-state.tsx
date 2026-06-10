import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ServiceErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-4 text-destructive" />
        <div>
          <h3 className="font-semibold">Unable to load services</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <Button className="w-fit" onClick={onRetry} variant="outline">
        Retry
      </Button>
    </div>
  );
}
