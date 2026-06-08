"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Loader2, Plus, Terminal } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import {
  AgentApiError,
  type AgentEnrollment,
  type RegisterAgentInput,
} from "@/lib/api/agents";

import { useRegisterAgent } from "./use-agents";

const defaultAgentApiUrl = "http://localhost:8080";

const registerAgentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(120, "Name must be 120 characters or fewer."),
});

type RegisterAgentFormValues = z.input<typeof registerAgentSchema>;
type RegisterAgentPayload = z.output<typeof registerAgentSchema>;
type RegisterAgentField = keyof RegisterAgentFormValues;

const emptyRegisterAgentValues: RegisterAgentFormValues = {
  name: "",
};

function toRegisterAgentInput(
  payload: RegisterAgentPayload
): RegisterAgentInput {
  return {
    name: payload.name,
  };
}

export function RegisterAgentDialog() {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<AgentEnrollment | null>(null);
  const [copied, setCopied] = useState<"token" | "command" | null>(null);
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
      const enrolled = await registerAgent.mutateAsync(toRegisterAgentInput(values));
      form.reset(emptyRegisterAgentValues);
      setEnrollment(enrolled);
      toast.success("Agent enrolled.", {
        description: enrolled.agent.name,
      });
    } catch (error) {
      if (error instanceof AgentApiError && error.status === 409) {
        const message = "An agent with matching unique data already exists.";
        setFormError(message);
        toast.error("Unable to enroll agent.", {
          description: message,
        });
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "Unable to register the agent right now.";

      setFormError(message);
      toast.error("Unable to enroll agent.", {
        description: message,
      });
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset(emptyRegisterAgentValues);
      setFormError(null);
      setEnrollment(null);
      setCopied(null);
    }
  }

  async function copyValue(kind: "token" | "command", value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1500);
  }

  const runCommand = enrollment
    ? `KYVORA_API_URL=${defaultAgentApiUrl} \\
KYVORA_AGENT_ID=${enrollment.agent.id} \\
KYVORA_AGENT_TOKEN=${enrollment.agentToken} \\
npm run dev:agent`
    : "";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Register agent
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{enrollment ? "Agent token" : "Enroll agent"}</DialogTitle>
          <DialogDescription>
            {enrollment
              ? "This token is shown only once."
              : "Create an agent and generate a one-time enrollment token."}
          </DialogDescription>
        </DialogHeader>

        {enrollment ? (
          <div className="grid gap-4">
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              This token is shown only once. Store it securely before closing
              this dialog.
            </div>

            <TokenDetail label="Agent ID" value={enrollment.agent.id} />
            <TokenDetail label="API Server URL" value={defaultAgentApiUrl} />

            <div className="grid gap-2">
              <Label>Agent Token</Label>
              <div className="flex min-w-0 gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs">
                  {enrollment.agentToken}
                </code>
                <Button
                  aria-label="Copy agent token"
                  size="icon"
                  type="button"
                  variant="outline"
                  onClick={() => void copyValue("token", enrollment.agentToken)}
                >
                  {copied === "token" ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Run command</Label>
              <div className="rounded-md border bg-muted">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <Terminal className="size-4 text-muted-foreground" />
                  <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    onClick={() => void copyValue("command", runCommand)}
                  >
                    {copied === "command" ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                    Copy command
                  </Button>
                </div>
                <pre className="overflow-x-auto p-3 text-xs">
                  <code>{runCommand}</code>
                </pre>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="grid gap-4"
            onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
          >
            {formError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                Enroll agent
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TokenDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <code className="overflow-x-auto rounded-md border bg-muted px-3 py-2 font-mono text-xs">
        {value}
      </code>
    </div>
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
