import { Badge } from "@/components/ui/badge";
import type { ServerStatus } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const statusClasses: Record<ServerStatus, string> = {
  ONLINE:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 dark:bg-emerald-500/15",
  OFFLINE: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  UNKNOWN: "border-amber-500/30 bg-amber-500/10 text-amber-300",
};

export function ServerStatusBadge({ status }: { status: ServerStatus }) {
  return (
    <Badge className={cn("border", statusClasses[status])} variant="outline">
      {status}
    </Badge>
  );
}
