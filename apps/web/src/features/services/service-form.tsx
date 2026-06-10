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
import type { ServerInventoryItem } from "@/lib/api/servers";
import type {
  CreateServiceInput,
  ManagedServiceItem,
  ServiceCategory,
  ServiceProtocol,
  ServiceStatus,
} from "@/lib/api/services";

export const serviceProtocols = ["HTTP", "HTTPS", "TCP", "UDP"] as const;
export const serviceStatuses = ["ONLINE", "OFFLINE", "UNKNOWN"] as const;
export const serviceCategories = [
  "MONITORING",
  "NETWORKING",
  "MEDIA",
  "STORAGE",
  "SECURITY",
  "DEVELOPMENT",
  "DATABASES",
  "AUTOMATION",
  "PRODUCTIVITY",
  "INFRASTRUCTURE",
  "OTHER",
] as const;

const hostnamePattern =
  /^$|^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$/;
const ipv4Pattern =
  /^$|^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

export const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2,000 characters or fewer."),
  url: z.string().trim().max(2048, "URL must be 2,048 characters or fewer."),
  hostname: z
    .string()
    .trim()
    .max(253, "Hostname must be 253 characters or fewer.")
    .regex(hostnamePattern, "Enter a valid hostname."),
  ipAddress: z.string().trim().regex(ipv4Pattern, "Enter a valid IPv4 address."),
  port: z.string().transform((value, context) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
      context.addIssue({
        code: "custom",
        message: "Port must be between 1 and 65535.",
      });
      return null;
    }
    return parsed;
  }),
  protocol: z.enum(serviceProtocols, {
    error: "Choose a protocol.",
  }),
  category: z.enum(serviceCategories, {
    error: "Choose a category.",
  }),
  status: z.enum(serviceStatuses, {
    error: "Choose a status.",
  }),
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
  notes: z.string().trim().max(10000, "Notes must be 10,000 characters or fewer."),
  linkedServerId: z.string(),
});

export type ServiceFormValues = z.input<typeof serviceFormSchema>;
export type ServiceFormPayload = z.output<typeof serviceFormSchema>;

export const emptyServiceFormValues: ServiceFormValues = {
  name: "",
  description: "",
  url: "",
  hostname: "",
  ipAddress: "",
  port: "",
  protocol: "HTTPS",
  category: "OTHER",
  status: "UNKNOWN",
  tags: "",
  notes: "",
  linkedServerId: "NONE",
};

export function toServiceFormValues(
  service: ManagedServiceItem
): ServiceFormValues {
  return {
    name: service.name,
    description: service.description ?? "",
    url: service.url ?? "",
    hostname: service.hostname ?? "",
    ipAddress: service.ipAddress ?? "",
    port: service.port ? String(service.port) : "",
    protocol: service.protocol,
    category: service.category,
    status: service.status,
    tags: service.tags.join(", "),
    notes: service.notes ?? "",
    linkedServerId: service.linkedServer?.id ?? "NONE",
  };
}

export function toServiceInput(
  payload: ServiceFormPayload
): CreateServiceInput {
  return {
    name: payload.name,
    description: payload.description,
    url: payload.url,
    hostname: payload.hostname,
    ipAddress: payload.ipAddress,
    port: payload.port,
    protocol: payload.protocol,
    category: payload.category,
    status: payload.status,
    tags: payload.tags,
    notes: payload.notes,
    linkedServerId:
      payload.linkedServerId === "NONE" ? null : payload.linkedServerId,
  };
}

export function ServiceForm({
  cancelLabel = "Cancel",
  form,
  formError,
  idPrefix,
  isPending,
  onCancel,
  onSubmit,
  servers,
  submitIcon,
  submitLabel,
}: {
  cancelLabel?: string;
  form: UseFormReturn<ServiceFormValues, unknown, ServiceFormPayload>;
  formError: string | null;
  idPrefix: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (values: ServiceFormPayload) => Promise<void>;
  servers: ServerInventoryItem[];
  submitIcon: ReactNode;
  submitLabel: string;
}) {
  const {
    formState: { errors },
    register,
    watch,
  } = form;

  const selectedProtocol = watch("protocol");
  const selectedCategory = watch("category");
  const selectedStatus = watch("status");
  const selectedServerId = watch("linkedServerId");

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
            placeholder="Grafana"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>

        <FormField
          error={errors.url?.message}
          htmlFor={`${idPrefix}-url`}
          label="URL"
        >
          <Input
            id={`${idPrefix}-url`}
            placeholder="https://grafana.lab.example.com"
            aria-invalid={Boolean(errors.url)}
            {...register("url")}
          />
        </FormField>

        <FormField
          error={errors.hostname?.message}
          htmlFor={`${idPrefix}-hostname`}
          label="Hostname"
        >
          <Input
            id={`${idPrefix}-hostname`}
            placeholder="grafana.lab.example.com"
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
            placeholder="10.0.0.20"
            aria-invalid={Boolean(errors.ipAddress)}
            {...register("ipAddress")}
          />
        </FormField>

        <FormField
          error={errors.port?.message}
          htmlFor={`${idPrefix}-port`}
          label="Port"
        >
          <Input
            id={`${idPrefix}-port`}
            inputMode="numeric"
            placeholder="3000"
            aria-invalid={Boolean(errors.port)}
            {...register("port")}
          />
        </FormField>

        <FormField
          error={errors.protocol?.message}
          htmlFor={`${idPrefix}-protocol`}
          label="Protocol"
        >
          <Select
            value={selectedProtocol}
            onValueChange={(value) => {
              form.setValue("protocol", value as ServiceProtocol, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger
              id={`${idPrefix}-protocol`}
              className="w-full"
              aria-invalid={Boolean(errors.protocol)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {serviceProtocols.map((protocol) => (
                <SelectItem key={protocol} value={protocol}>
                  {protocol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          error={errors.category?.message}
          htmlFor={`${idPrefix}-category`}
          label="Category"
        >
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              form.setValue("category", value as ServiceCategory, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger
              id={`${idPrefix}-category`}
              className="w-full"
              aria-invalid={Boolean(errors.category)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {serviceCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {formatCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          error={errors.status?.message}
          htmlFor={`${idPrefix}-status`}
          label="Status"
        >
          <Select
            value={selectedStatus}
            onValueChange={(value) => {
              form.setValue("status", value as ServiceStatus, {
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
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              {serviceStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {formatCategory(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField
          error={errors.linkedServerId?.message}
          htmlFor={`${idPrefix}-linkedServerId`}
          label="Linked server"
        >
          <Select
            value={selectedServerId}
            onValueChange={(value) => {
              form.setValue("linkedServerId", value, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
              });
            }}
          >
            <SelectTrigger id={`${idPrefix}-linkedServerId`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="NONE">Unassigned</SelectItem>
              {servers.map((server) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
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
            placeholder="monitoring, internal"
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
          placeholder="Dashboards for metrics and logs"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>

      <FormField
        error={errors.notes?.message}
        htmlFor={`${idPrefix}-notes`}
        label="Notes"
      >
        <Textarea
          id={`${idPrefix}-notes`}
          placeholder="Runbook notes, owner, backup details"
          aria-invalid={Boolean(errors.notes)}
          {...register("notes")}
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

export function formatCategory(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function FormField({
  children,
  error,
  htmlFor,
  label,
}: {
  children: ReactNode;
  error?: string;
  htmlFor: string;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
