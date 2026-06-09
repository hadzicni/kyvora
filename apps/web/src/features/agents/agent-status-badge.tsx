import { Badge } from "@/components/ui/badge";
import type { AgentStatus } from "@/lib/api/agents";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const statusClasses: Record<AgentStatus, string> = {
  PENDING: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  ONLINE:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 dark:bg-emerald-500/15",
  OFFLINE: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  UNKNOWN: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  DECOMMISSIONED: "border-zinc-500/30 bg-zinc-500/10 text-zinc-300",
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const t = useTranslations("statuses");

  return (
    <Badge className={cn("border", statusClasses[status])} variant="outline">
      {t(status)}
    </Badge>
  );
}
