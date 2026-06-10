"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import { ServiceApiError } from "@/lib/api/services";
import {
  emptyServiceFormValues,
  ServiceForm,
  type ServiceFormPayload,
  type ServiceFormValues,
  serviceFormSchema,
  toServiceInput,
} from "./service-form";
import { useCreateService } from "./use-services";

export function CreateServiceDialog({
  servers,
}: {
  servers: ServerInventoryItem[];
}) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createService = useCreateService();
  const form = useForm<ServiceFormValues, unknown, ServiceFormPayload>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyServiceFormValues,
  });

  async function onSubmit(values: ServiceFormPayload) {
    setFormError(null);

    try {
      const service = await createService.mutateAsync(toServiceInput(values));
      toast.success("Service created.", {
        description: service.name,
      });
      form.reset(emptyServiceFormValues);
      setOpen(false);
    } catch (error) {
      const message =
        error instanceof ServiceApiError || error instanceof Error
          ? error.message
          : "Unable to create the service right now.";

      setFormError(message);
      toast.error("Unable to create service.", {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset(emptyServiceFormValues);
      setFormError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create service
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create service</DialogTitle>
          <DialogDescription>
            Register a service entry that Kyvora should track.
          </DialogDescription>
        </DialogHeader>
        <ServiceForm
          form={form}
          formError={formError}
          idPrefix="create-service"
          isPending={createService.isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={onSubmit}
          servers={servers}
          submitIcon={<Plus className="size-4" />}
          submitLabel="Create service"
        />
      </DialogContent>
    </Dialog>
  );
}
