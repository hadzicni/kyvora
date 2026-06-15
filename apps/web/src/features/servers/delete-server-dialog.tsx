"use client";

import { Loader2, Trash2 } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { useDeleteServer } from "@/features/servers/use-servers";
import { ApiError, type ServerInventoryItem } from "@/lib/api/servers";

type DeleteServerDialogProps = {
  server: ServerInventoryItem;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerSize?: ComponentProps<typeof Button>["size"];
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export function DeleteServerDialog({
  server,
  triggerClassName,
  triggerLabel,
  triggerSize = triggerLabel ? "default" : "icon-sm",
  triggerVariant = triggerLabel ? "destructive" : "ghost",
}: DeleteServerDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteServer = useDeleteServer();

  async function handleDelete() {
    setErrorMessage(null);

    try {
      await deleteServer.mutateAsync(server.id);
      setOpen(false);
      toast.success(t("servers.deletedToast"), {
        description: server.hostname,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const message = t("servers.noLongerExists");
        setErrorMessage(message);
        toast.error(t("servers.deleteFailedToast"), {
          description: message,
        });
        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        const message = t("servers.deleteReferenced");
        setErrorMessage(message);
        toast.error(t("servers.deleteFailedToast"), {
          description: message,
        });
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : t("servers.deleteFailedDescription");

      setErrorMessage(message);
      toast.error(t("servers.deleteFailedToast"), {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setErrorMessage(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          aria-label={
            triggerLabel
              ? undefined
              : t("servers.deleteAria", { name: server.name })
          }
        >
          <Trash2 className={triggerLabel ? "size-4" : "size-4 text-destructive"} />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("servers.deleteServer")}</DialogTitle>
          <DialogDescription>
            {t("servers.deleteNamedConfirmation", { name: server.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
          <div className="font-medium">{server.hostname}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {server.ipAddress}
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t("actions.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={deleteServer.isPending}
            onClick={() => void handleDelete()}
          >
            {deleteServer.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            {t("servers.deleteServer")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
