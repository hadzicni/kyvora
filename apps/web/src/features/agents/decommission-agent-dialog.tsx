"use client";

import { RefreshCw, Unplug } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Agent } from "@/lib/api/agents";

import { useDecommissionAgent } from "./use-agents";

export function DecommissionAgentDialog({
  agent,
  trigger,
}: {
  agent: Agent;
  trigger?: ReactNode;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const decommissionAgent = useDecommissionAgent();

  async function decommission() {
    try {
      await decommissionAgent.mutateAsync(agent.id);
      setOpen(false);
      toast.success(t("agents.decommissionedToast"), {
        description: agent.name,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("agents.decommissionFailedDescription");
      toast.error(t("agents.decommissionFailedToast"), {
        description: message,
      });
    }
  }

  const displayName = agent.serverName
    ? `${agent.name} on ${agent.serverName}`
    : `${agent.name} (${agent.hostname})`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            <Unplug className="size-4" />
            {t("agents.decommissionAgent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("agents.decommissionTitle")}</DialogTitle>
          <DialogDescription>
            {t("agents.decommissionDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/20 p-3 text-sm">
          <div className="font-medium">{displayName}</div>
          <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {agent.id}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={decommissionAgent.isPending}
            onClick={() => void decommission()}
          >
            {decommissionAgent.isPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Unplug className="size-4" />
            )}
            {t("agents.decommissionAgent")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
