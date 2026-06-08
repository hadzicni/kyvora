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
import {
  emptyServerFormValues,
  ServerForm,
  type ServerFormPayload,
  type ServerFormValues,
  serverFormSchema,
  toServerInput,
} from "@/features/servers/server-form";
import { useCreateServer } from "@/features/servers/use-servers";
import { ApiError } from "@/lib/api/servers";

export function getConflictField(error: ApiError): "hostname" | "ipAddress" | null {
  const duplicateDetail = error.details.find(
    (detail) =>
      detail.startsWith("hostname:") || detail.startsWith("ipAddress:")
  );

  if (duplicateDetail?.startsWith("hostname:")) {
    return "hostname";
  }

  if (duplicateDetail?.startsWith("ipAddress:")) {
    return "ipAddress";
  }

  if (error.message.toLowerCase().includes("hostname")) {
    return "hostname";
  }

  if (error.message.toLowerCase().includes("ipaddress")) {
    return "ipAddress";
  }

  return null;
}

export function CreateServerDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createServer = useCreateServer();
  const form = useForm<ServerFormValues, unknown, ServerFormPayload>({
    resolver: zodResolver(serverFormSchema),
    defaultValues: emptyServerFormValues,
  });

  async function onSubmit(values: ServerFormPayload) {
    setFormError(null);

    try {
      const server = await createServer.mutateAsync(toServerInput(values));
      form.reset(emptyServerFormValues);
      setOpen(false);
      toast.success("Server created.", {
        description: server.hostname,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const field = getConflictField(error);
        const message =
          field === "hostname"
            ? "A server with this hostname already exists."
            : field === "ipAddress"
              ? "A server with this IP address already exists."
              : "A server with matching unique inventory data already exists.";

        setFormError(message);
        toast.error("Unable to create server.", {
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
          : "Unable to create the server right now.";

      setFormError(message);
      toast.error("Unable to create server.", {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(emptyServerFormValues);
      setFormError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Create server
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create server</DialogTitle>
          <DialogDescription>
            Add a managed server to the inventory.
          </DialogDescription>
        </DialogHeader>

        <ServerForm
          form={form}
          formError={formError}
          idPrefix="create-server"
          isPending={createServer.isPending}
          onCancel={() => handleOpenChange(false)}
          onSubmit={onSubmit}
          submitIcon={<Plus className="size-4" />}
          submitLabel="Create server"
        />
      </DialogContent>
    </Dialog>
  );
}
