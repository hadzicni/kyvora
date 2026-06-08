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
import { AgentApiError, type RegisterAgentInput } from "@/lib/api/agents";

import { useRegisterAgent } from "./use-agents";

const hostnamePattern =
  /^(?=.{1,253}$)(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)\.)*(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)$/;

const registerAgentSchema = z.object({
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
  version: z
    .string()
    .trim()
    .min(1, "Version is required.")
    .max(64, "Version must be 64 characters or fewer."),
});

type RegisterAgentFormValues = z.input<typeof registerAgentSchema>;
type RegisterAgentPayload = z.output<typeof registerAgentSchema>;
type RegisterAgentField = keyof RegisterAgentFormValues;

const emptyRegisterAgentValues: RegisterAgentFormValues = {
  name: "",
  hostname: "",
  version: "",
};

function toRegisterAgentInput(
  payload: RegisterAgentPayload
): RegisterAgentInput {
  return {
    name: payload.name,
    hostname: payload.hostname,
    version: payload.version,
  };
}

function getDuplicateHostnameMessage(error: AgentApiError) {
  const hasHostnameDetail = error.details.some((detail) =>
    detail.startsWith("hostname:")
  );

  if (hasHostnameDetail || error.message.toLowerCase().includes("hostname")) {
    return "An agent with this hostname already exists.";
  }

  return "An agent with matching unique data already exists.";
}

export function RegisterAgentDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const registerAgent = useRegisterAgent();
  const form = useForm<
    RegisterAgentFormValues,
    unknown,
    RegisterAgentPayload
  >({
    resolver: zodResolver(registerAgentSchema),
    defaultValues: emptyRegisterAgentValues,
  });
  const {
    formState: { errors },
    register,
  } = form;

  async function onSubmit(values: RegisterAgentPayload) {
    setFormError(null);

    try {
      await registerAgent.mutateAsync(toRegisterAgentInput(values));
      form.reset(emptyRegisterAgentValues);
      setOpen(false);
    } catch (error) {
      if (error instanceof AgentApiError && error.status === 409) {
        const message = getDuplicateHostnameMessage(error);
        setFormError(message);
        form.setError("hostname", { type: "server", message });
        return;
      }

      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to register the agent right now."
      );
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(emptyRegisterAgentValues);
      setFormError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Register agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Register agent</DialogTitle>
          <DialogDescription>
            Add an agent record for local Agent Management testing.
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

          <FormField
            error={errors.name?.message}
            htmlFor="register-agent-name"
            label="Name"
          >
            <Input
              id="register-agent-name"
              placeholder="Homelab Agent 01"
              aria-invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </FormField>

          <FormField
            error={errors.hostname?.message}
            htmlFor="register-agent-hostname"
            label="Hostname"
          >
            <Input
              id="register-agent-hostname"
              placeholder="node01.example.com"
              aria-invalid={Boolean(errors.hostname)}
              {...register("hostname")}
            />
          </FormField>

          <FormField
            error={errors.version?.message}
            htmlFor="register-agent-version"
            label="Version"
          >
            <Input
              id="register-agent-version"
              placeholder="0.1.0"
              aria-invalid={Boolean(errors.version)}
              {...register("version")}
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
            <Button type="submit" disabled={registerAgent.isPending}>
              {registerAgent.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              Register agent
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
  htmlFor,
  label,
}: {
  children: React.ReactNode;
  error?: string;
  htmlFor: RegisterAgentField | string;
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
