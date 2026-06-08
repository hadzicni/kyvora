"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateServer } from "@/features/servers/use-servers";
import { ApiError, type CreateServerInput } from "@/lib/api/servers";
import { cn } from "@/lib/utils";

const statuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const;

const hostnamePattern =
  /^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$/;
const ipv4Pattern =
  /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

const createServerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be 120 characters or fewer."),
  hostname: z
    .string()
    .trim()
    .min(1, "Hostname is required.")
    .max(253, "Hostname must be 253 characters or fewer.")
    .regex(hostnamePattern, "Enter a valid hostname."),
  ipAddress: z
    .string()
    .trim()
    .min(1, "IP address is required.")
    .regex(ipv4Pattern, "Enter a valid IPv4 address."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2,000 characters or fewer."),
  tags: z.string().transform((value, context) => {
    const tags = value
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    const uniqueTags = Array.from(new Set(tags));

    if (uniqueTags.length > 20) {
      context.addIssue({
        code: "custom",
        message: "Use 20 tags or fewer.",
      });
    }

    const oversizedTag = uniqueTags.find((tag) => tag.length > 50);
    if (oversizedTag) {
      context.addIssue({
        code: "custom",
        message: `"${oversizedTag}" must be 50 characters or fewer.`,
      });
    }

    return uniqueTags;
  }),
  operatingSystem: z
    .string()
    .trim()
    .max(120, "Operating system must be 120 characters or fewer."),
  status: z.enum(statuses, {
    error: "Choose a status.",
  }),
});

type CreateServerFormValues = z.input<typeof createServerSchema>;
type CreateServerPayload = z.output<typeof createServerSchema>;
type FieldName = keyof CreateServerFormValues;

const defaultValues: CreateServerFormValues = {
  name: "",
  hostname: "",
  ipAddress: "",
  description: "",
  tags: "",
  operatingSystem: "",
  status: "UNKNOWN",
};

function toCreateServerInput(payload: CreateServerPayload): CreateServerInput {
  return {
    ...payload,
    description: payload.description,
    operatingSystem: payload.operatingSystem,
  };
}

function getConflictField(error: ApiError): "hostname" | "ipAddress" | null {
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

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

export function CreateServerDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const createServer = useCreateServer();
  const form = useForm<CreateServerFormValues, unknown, CreateServerPayload>({
    resolver: zodResolver(createServerSchema),
    defaultValues,
  });

  const {
    formState: { errors },
    register,
  } = form;

  async function onSubmit(values: CreateServerPayload) {
    setFormError(null);

    try {
      await createServer.mutateAsync(toCreateServerInput(values));
      form.reset(defaultValues);
      setOpen(false);
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

        if (field) {
          form.setError(field, { type: "server", message });
        }
        return;
      }

      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to create the server right now."
      );
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(defaultValues);
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

        <form
          className="grid gap-4"
          onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        >
          {formError ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="name" label="Name" error={errors.name?.message}>
              <Input
                id="name"
                placeholder="prod-api-01"
                aria-invalid={Boolean(errors.name)}
                {...register("name")}
              />
            </FormField>

            <FormField
              name="hostname"
              label="Hostname"
              error={errors.hostname?.message}
            >
              <Input
                id="hostname"
                placeholder="prod-api-01.internal"
                aria-invalid={Boolean(errors.hostname)}
                {...register("hostname")}
              />
            </FormField>

            <FormField
              name="ipAddress"
              label="IP address"
              error={errors.ipAddress?.message}
            >
              <Input
                id="ipAddress"
                inputMode="decimal"
                placeholder="10.0.2.15"
                aria-invalid={Boolean(errors.ipAddress)}
                {...register("ipAddress")}
              />
            </FormField>

            <FormField
              name="operatingSystem"
              label="Operating system"
              error={errors.operatingSystem?.message}
            >
              <Input
                id="operatingSystem"
                placeholder="Ubuntu 24.04 LTS"
                aria-invalid={Boolean(errors.operatingSystem)}
                {...register("operatingSystem")}
              />
            </FormField>

            <FormField name="status" label="Status" error={errors.status?.message}>
              <select
                id="status"
                className={cn(
                  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
                )}
                aria-invalid={Boolean(errors.status)}
                {...register("status")}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField name="tags" label="Tags" error={errors.tags?.message}>
              <Input
                id="tags"
                placeholder="production, api, us-east"
                aria-invalid={Boolean(errors.tags)}
                {...register("tags")}
              />
            </FormField>
          </div>

          <FormField
            name="description"
            label="Description"
            error={errors.description?.message}
          >
            <Textarea
              id="description"
              placeholder="Primary production API node"
              aria-invalid={Boolean(errors.description)}
              {...register("description")}
            />
          </FormField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createServer.isPending}>
              {createServer.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Create server
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  children,
  error,
  label,
  name,
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  name: FieldName;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}
