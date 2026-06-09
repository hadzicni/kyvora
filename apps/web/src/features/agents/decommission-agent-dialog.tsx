"use client";

import { RefreshCw, Unplug } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

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
  const [open, setOpen] = useState(false);
  const decommissionAgent = useDecommissionAgent();

  async function decommission() {
    try {
      await decommissionAgent.mutateAsync(agent.id);
      setOpen(false);
      toast.success("Agent decommissioned.", {
        description: agent.name,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to decommission the agent right now.";
      toast.error("Unable to decommission agent.", {
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
            Decommission agent
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Decommission agent?</DialogTitle>
          <DialogDescription>
            This revokes the agent token and unlinks the agent from this server.
            The server will remain in inventory and you can enroll a new agent
            later.
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
            Cancel
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
            Decommission agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
