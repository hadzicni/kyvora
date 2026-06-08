import { Server } from "lucide-react";

export function ServerEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
        <Server className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium">No servers found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Servers created through the Kyvora API will appear here once inventory
        data is available.
      </p>
    </div>
  );
}
