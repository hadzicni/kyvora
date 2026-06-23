"use client";

import { Clipboard, RefreshCw, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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

import { useRemoveAgent } from "./use-agents";

const uninstallCommand =
  "curl -fsSL https://raw.githubusercontent.com/hadzicni/kyvora/main/scripts/uninstall-agent.sh | sudo bash";

export function RemoveAgentDialog({
  agent,
  trigger,
  redirectTo,
}: {
  agent: Agent;
  trigger?: ReactNode;
  redirectTo?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const removeAgent = useRemoveAgent();

  async function remove() {
    try {
      await removeAgent.mutateAsync(agent.id);
      setOpen(false);
      toast.success(t("agents.removedToast"), {
        description: agent.name,
      });
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t("agents.removeFailedDescription");
      toast.error(t("agents.removeFailedToast"), {
        description: message,
      });
    }
  }

  async function copyUninstallCommand() {
    await navigator.clipboard.writeText(uninstallCommand);
    toast.success(t("agents.uninstallCommandCopied"));
  }

  const displayName = agent.serverName
    ? `${agent.name} on ${agent.serverName}`
    : `${agent.name} (${agent.hostname})`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline">
            <Trash2 className="size-4" />
            {t("agents.removeAgent")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("agents.removeTitle")}</DialogTitle>
          <DialogDescription>
            {t("agents.removeDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/20 p-3 text-sm">
          <div className="font-medium">{displayName}</div>
          <div className="mt-1 break-all font-mono text-xs text-muted-foreground">
            {agent.id}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("agents.uninstallHostTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {t("agents.uninstallHostDescription")}
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-zinc-950 p-2 text-zinc-100">
            <code className="min-w-0 flex-1 overflow-x-auto p-1 text-xs">
              {uninstallCommand}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-zinc-100 hover:bg-zinc-800 hover:text-white"
              aria-label={t("agents.copyUninstallCommand")}
              onClick={() => void copyUninstallCommand()}
            >
              <Clipboard className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("agents.uninstallPreservesConfig")}
          </p>
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
            disabled={removeAgent.isPending}
            onClick={() => void remove()}
          >
            {removeAgent.isPending ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {t("agents.removeAgent")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
