import { Bot } from "lucide-react";

export function AgentEmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-md border border-dashed bg-muted/20 p-8 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-md bg-muted">
        <Bot className="size-5 text-muted-foreground" />
      </div>
      <h2 className="text-base font-medium">No agents registered</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Registered Kyvora agents will appear here once they are added through
        the Agent Management API.
      </p>
    </div>
  );
}
