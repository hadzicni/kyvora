"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import type { ComponentProps } from "react";
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
import { getConflictField } from "@/features/servers/create-server-dialog";
import {
  ServerForm,
  type ServerFormPayload,
  type ServerFormValues,
  serverFormSchema,
  toServerFormValues,
  toServerInput,
} from "@/features/servers/server-form";
import { useUpdateServer } from "@/features/servers/use-servers";
import { ApiError, type ServerInventoryItem } from "@/lib/api/servers";

type EditServerDialogProps = {
  server: ServerInventoryItem;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerSize?: ComponentProps<typeof Button>["size"];
  triggerVariant?: ComponentProps<typeof Button>["variant"];
};

export function EditServerDialog({
  server,
  triggerClassName,
  triggerLabel,
  triggerSize = triggerLabel ? "default" : "icon-sm",
  triggerVariant = triggerLabel ? "default" : "ghost",
}: EditServerDialogProps) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const updateServer = useUpdateServer();
  const form = useForm<ServerFormValues, unknown, ServerFormPayload>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: toServerFormValues(server),
  });

  async function onSubmit(values: ServerFormPayload) {
    setFormError(null);

    try {
      await updateServer.mutateAsync({
        id: server.id,
        input: toServerInput(values),
      });
      setOpen(false);
      toast.success("Server updated.", {
        description: server.hostname,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const message = "This server no longer exists. Refresh the inventory.";
        setFormError(message);
        toast.error("Unable to update server.", {
          description: message,
        });
        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        const field = getConflictField(error);
        const message =
          field === "hostname"
            ? "Another server already uses this hostname."
            : field === "ipAddress"
              ? "Another server already uses this IP address."
              : "Another server has matching unique inventory data.";

        setFormError(message);
        toast.error("Unable to update server.", {
          description: message,
        });

        if (field) {
          form.setError(field, { type: "server", message });
        }
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to update the server right now.";

      setFormError(message);
      toast.error("Unable to update server.", {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    form.reset(toServerFormValues(server));
    setFormError(null);
    setOpen(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          size={triggerSize}
          className={triggerClassName}
          aria-label={triggerLabel ? undefined : `Edit ${server.name}`}
        >
          <Pencil className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit server</DialogTitle>
          <DialogDescription>
            Update inventory details for {server.name}.
          </DialogDescription>
        </DialogHeader>

        <ServerForm
          childrenBeforeFooter={
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              Status is managed by the linked agent.
            </div>
          }
          form={form}
          formError={formError}
          idPrefix={`edit-server-${server.id}`}
          isPending={updateServer.isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={onSubmit}
          showStatusField={false}
          submitIcon={<Pencil className="size-4" />}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}
