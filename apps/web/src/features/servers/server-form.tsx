"use client";

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  CreateServerInput,
  ServerInventoryItem,
  ServerStatus,
} from "@/lib/api/servers";

export const serverStatuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const;

const hostnamePattern =
  /^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$/;
const ipv4Pattern =
  /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const serverFormSchema = z.object({
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
  status: z.enum(serverStatuses, {
    error: "Choose a status.",
  }),
});

export type ServerFormValues = z.input<typeof serverFormSchema>;
export type ServerFormPayload = z.output<typeof serverFormSchema>;
type FieldName = keyof ServerFormValues;

export const emptyServerFormValues: ServerFormValues = {
  name: "",
  hostname: "",
  ipAddress: "",
  description: "",
  tags: "",
  operatingSystem: "",
  status: "UNKNOWN",
};

export function toServerFormValues(
  server: ServerInventoryItem
): ServerFormValues {
  return {
    name: server.name,
    hostname: server.hostname,
    ipAddress: server.ipAddress,
    description: server.description ?? "",
    tags: server.tags.join(", "),
    operatingSystem: server.operatingSystem ?? "",
    status: server.status,
  };
}

export function toServerInput(payload: ServerFormPayload): CreateServerInput {
  return {
    name: payload.name,
    hostname: payload.hostname,
    ipAddress: payload.ipAddress,
    description: payload.description,
    tags: payload.tags,
    operatingSystem: payload.operatingSystem,
    status: payload.status as ServerStatus,
  };
}

export function ServerForm({
  cancelLabel = "Cancel",
  form,
  formError,
  idPrefix,
  isPending,
  onCancel,
  onSubmit,
  submitIcon,
  submitLabel,
}: {
  cancelLabel?: string;
  form: UseFormReturn<ServerFormValues, unknown, ServerFormPayload>;
  formError: string | null;
  idPrefix: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (values: ServerFormPayload) => Promise<void>;
  submitIcon: ReactNode;
  submitLabel: string;
}) {
  const {
    formState: { errors },
    register,
    watch,
  } = form;

  const selectedStatus = watch("status");

  return (
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
        <FormField
          error={errors.name?.message}
          htmlFor={`${idPrefix}-name`}
          label="Name"
        >
          <Input
            id={`${idPrefix}-name`}
            placeholder="prod-api-01"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField
          error={errors.hostname?.message}
          htmlFor={`${idPrefix}-hostname`}
          label="Hostname"
        >
          <Input
            id={`${idPrefix}-hostname`}
            placeholder="prod-api-01.internal"
            aria-invalid={Boolean(errors.hostname)}
            {...register("hostname")}
          />
        </FormField>

        <FormField
          error={errors.ipAddress?.message}
          htmlFor={`${idPrefix}-ipAddress`}
          label="IP address"
        >
          <Input
            id={`${idPrefix}-ipAddress`}
            inputMode="decimal"
            placeholder="10.0.2.15"
            aria-invalid={Boolean(errors.ipAddress)}
            {...register("ipAddress")}
          />
        </FormField>

        <FormField
          error={errors.operatingSystem?.message}
          htmlFor={`${idPrefix}-operatingSystem`}
          label="Operating system"
        >
          <Input
            id={`${idPrefix}-operatingSystem`}
            placeholder="Ubuntu 24.04 LTS"
            aria-invalid={Boolean(errors.operatingSystem)}
            {...register("operatingSystem")}
          />
        </FormField>

        <FormField
          error={errors.status?.message}
          htmlFor={`${idPrefix}-status`}
          label="Status"
        >
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              form.setValue("status", value as ServerStatus, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger
              id={`${idPrefix}-status`}
              className="w-full"
              aria-invalid={Boolean(errors.status)}
            >
              <SelectValue placeholder="Choose a status" />
            </SelectTrigger>
            <SelectContent position="popper">
              {serverStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          error={errors.tags?.message}
          htmlFor={`${idPrefix}-tags`}
          label="Tags"
        >
          <Input
            id={`${idPrefix}-tags`}
            placeholder="production, api, us-east"
            aria-invalid={Boolean(errors.tags)}
            {...register("tags")}
          />
        </FormField>
      </div>

      <FormField
        error={errors.description?.message}
        htmlFor={`${idPrefix}-description`}
        label="Description"
      >
        <Textarea
          id={`${idPrefix}-description`}
          placeholder="Primary production API node"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : submitIcon}
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}

function FormField({
  children,
  error,
  htmlFor,
  label,
}: {
  children: ReactNode;
  error?: string;
  htmlFor: FieldName | string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}
