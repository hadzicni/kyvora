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
import type { ManagedServiceItem } from "@/lib/api/services";
import { useDeleteService } from "./use-services";

export function DeleteServiceDialog({
  onDeleted,
  service,
}: {
  onDeleted?: () => void;
  service: ManagedServiceItem;
}) {
  const [open, setOpen] = useState(false);
  const deleteService = useDeleteService();

  async function confirmDelete() {
    try {
      await deleteService.mutateAsync(service.id);
      toast.success("Service deleted.", {
        description: service.name,
      });
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error("Unable to delete service.", {
        description:
          error instanceof Error
            ? error.message
            : "The service could not be deleted right now.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Delete ${service.name}`}
          size="icon"
          variant="ghost"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete service</DialogTitle>
          <DialogDescription>
            This permanently removes {service.name} from the service registry.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={deleteService.isPending}
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            disabled={deleteService.isPending}
            onClick={() => void confirmDelete()}
            type="button"
            variant="destructive"
          >
            {deleteService.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
