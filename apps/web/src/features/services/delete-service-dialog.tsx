"use client";

import { Loader2, Trash2 } from "lucide-react";
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
import type { ManagedServiceItem } from "@/lib/api/services";
import { useDeleteService } from "./use-services";

export function DeleteServiceDialog({
  onDeleted,
  service,
}: {
  onDeleted?: () => void;
  service: ManagedServiceItem;
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const deleteService = useDeleteService();

  async function confirmDelete() {
    try {
      await deleteService.mutateAsync(service.id);
      toast.success(t("services.deletedToast"), {
        description: service.name,
      });
      setOpen(false);
      onDeleted?.();
    } catch (error) {
      toast.error(t("services.deleteFailedToast"), {
        description:
          error instanceof Error
            ? error.message
            : t("services.deleteFailedDescription"),
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={t("services.deleteAria", { name: service.name })}
          size="icon"
          variant="ghost"
        >
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("services.deleteService")}</DialogTitle>
          <DialogDescription>
            {t("services.deleteConfirmation", { name: service.name })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={deleteService.isPending}
            onClick={() => setOpen(false)}
            type="button"
            variant="outline"
          >
            {t("actions.cancel")}
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
            {t("actions.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
