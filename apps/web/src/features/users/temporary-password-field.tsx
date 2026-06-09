"use client";

import { Copy, RefreshCw } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateTemporaryPassword } from "@/features/users/temporary-password";

type TemporaryPasswordFieldProps = {
  disabled?: boolean;
  id: string;
  label: string;
  value: string;
  register: UseFormRegisterReturn;
  onChange: (value: string) => void;
};

export function TemporaryPasswordField({
  disabled = false,
  id,
  label,
  value,
  register,
  onChange,
}: TemporaryPasswordFieldProps) {
  async function copyToClipboard() {
    if (!value) {
      return;
    }

    await navigator.clipboard.writeText(value);
    toast.success("Temporary password copied");
  }

  function regeneratePassword() {
    onChange(generateTemporaryPassword());
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="flex gap-2">
        <Input
          id={id}
          disabled={disabled}
          readOnly
          type="text"
          {...register}
        />

        <Button
          disabled={disabled || !value}
          onClick={() => void copyToClipboard()}
          type="button"
          variant="outline"
        >
          <Copy className="size-4" />
          Copy
        </Button>

        <Button
          disabled={disabled}
          onClick={regeneratePassword}
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-4" />
          New
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        A secure temporary password is generated automatically.
      </p>
    </div>
  );
}
