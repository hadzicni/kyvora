"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

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

export function EditServerDialog({ server }: { server: ServerInventoryItem }) {
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
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setFormError("This server no longer exists. Refresh the inventory.");
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

        if (field) {
          form.setError(field, { type: "server", message });
        }
        return;
      }

      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to update the server right now."
      );
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
        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${server.name}`}>
          <Pencil className="size-4" />
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
          form={form}
          formError={formError}
          idPrefix={`edit-server-${server.id}`}
          isPending={updateServer.isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={onSubmit}
          submitIcon={<Pencil className="size-4" />}
          submitLabel="Save changes"
        />
      </DialogContent>
    </Dialog>
  );
}
