"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ServerInventoryItem } from "@/lib/api/servers";
import type { ManagedServiceItem } from "@/lib/api/services";
import { ServiceApiError } from "@/lib/api/services";
import {
  ServiceForm,
  type ServiceFormPayload,
  type ServiceFormValues,
  serviceFormSchema,
  toServiceFormValues,
  toServiceInput,
} from "./service-form";
import { useUpdateService } from "./use-services";

export function EditServiceDialog({
  service,
  servers,
}: {
  service: ManagedServiceItem;
  servers: ServerInventoryItem[];
}) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const updateService = useUpdateService();
  const form = useForm<ServiceFormValues, unknown, ServiceFormPayload>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: toServiceFormValues(service),
  });

  async function onSubmit(values: ServiceFormPayload) {
    setFormError(null);

    try {
      const updated = await updateService.mutateAsync({
        id: service.id,
        input: toServiceInput(values),
      });
      toast.success(t("services.updatedToast"), {
        description: updated.name,
      });
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof ServiceApiError || error instanceof Error
          ? error.message
          : t("services.updateFailedDescription");

      setFormError(message);
      toast.error(t("services.updateFailedToast"), {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      form.reset(toServiceFormValues(service));
      setFormError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          aria-label={t("services.editAria", { name: service.name })}
          size="icon"
          variant="ghost"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("services.editService")}</DialogTitle>
          <DialogDescription>
            {t("services.editDescription", { name: service.name })}
          </DialogDescription>
        </DialogHeader>
        <ServiceForm
          form={form}
          formError={formError}
          idPrefix={`edit-service-${service.id}`}
          isPending={updateService.isPending}
          onCancel={() => setOpen(false)}
          onSubmit={onSubmit}
          servers={servers}
          submitIcon={<Pencil className="size-4" />}
          submitLabel={t("actions.save")}
        />
      </DialogContent>
    </Dialog>
  );
}
