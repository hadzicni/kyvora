"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
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

export function DeleteServerDialog({ server }: { server: ServerInventoryItem }) {
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteServer = useDeleteServer();

  async function handleDelete() {
    setErrorMessage(null);

    try {
      await deleteServer.mutateAsync(server.id);
      setOpen(false);
      toast.success("Server deleted.", {
        description: server.hostname,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const message = "This server no longer exists. Refresh the inventory.";
        setErrorMessage(message);
        toast.error("Unable to delete server.", {
          description: message,
        });
        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        const message =
          "This server cannot be deleted because it is still referenced elsewhere.";
        setErrorMessage(message);
        toast.error("Unable to delete server.", {
          description: message,
        });
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete the server right now.";

      setErrorMessage(message);
      toast.error("Unable to delete server.", {
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
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${server.name}`}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete server</DialogTitle>
          <DialogDescription>
            Delete {server.name} from the inventory. This action cannot be
            undone.
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
            Cancel
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
            Delete server
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
