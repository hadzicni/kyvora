"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/features/users/use-users";
import { supportedLocales } from "@/i18n/config";
import { useLocalePreference } from "@/i18n/locale-provider";
import { UsersApiError } from "@/lib/api/users";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  });

type ChangePasswordValues = z.output<typeof changePasswordSchema>;

function errorMessage(error: unknown) {
  if (error instanceof UsersApiError && error.details.length > 0) {
    return `${error.message}: ${error.details.join(", ")}`;
  }

  return error instanceof Error ? error.message : "Password change failed";
}

export default function ForcedPasswordChangePage() {
  const t = useTranslations();
  const { locale, setLocale } = useLocalePreference();
  const router = useRouter();
  const { data: session, update } = useSession();
  const changePasswordMutation = useChangePassword();
  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      const result = await signIn("credentials", {
        email: session?.user.email,
        password: values.newPassword,
        redirect: false,
        callbackUrl: "/",
      });

      if (!result || result.error) {
        toast.success("Password changed. Sign in again to continue.");
        router.replace("/login");
        return;
      }

      await update();
      toast.success("Password changed");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070a] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_75%_20%,rgba(99,102,241,0.14),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent_35%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_72%)]" />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/70 p-6 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-8">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex size-8 items-center justify-center">
              <Image
                src="/icon.svg"
                alt=""
                width={32}
                height={32}
                priority
                aria-hidden="true"
                className="size-8"
              />
            </span>
            <span className="text-xl font-semibold tracking-tight text-white">
              Kyvora
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            {t("auth.changePassword")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            An administrator issued a temporary password. Choose a new password
            before continuing.
          </p>
          <div className="mt-4 flex rounded-md border border-white/10 bg-white/5 p-0.5">
            {supportedLocales.map((supportedLocale) => (
              <button
                className={`rounded px-2.5 py-1 text-xs transition-colors ${
                  locale === supportedLocale
                    ? "bg-white text-zinc-950"
                    : "text-zinc-400 hover:text-white"
                }`}
                key={supportedLocale}
                onClick={() => setLocale(supportedLocale)}
                type="button"
              >
                {supportedLocale === "en"
                  ? t("common.english")
                  : t("common.german")}
              </button>
            ))}
          </div>
        </div>

        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-400" htmlFor="currentPassword">
              {t("auth.currentPassword")}
            </Label>
            <Input
              autoComplete="current-password"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:border-white/25 focus-visible:ring-white/15"
              id="currentPassword"
              type="password"
              {...form.register("currentPassword")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-400" htmlFor="newPassword">
              {t("auth.newPassword")}
            </Label>
            <Input
              autoComplete="new-password"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:border-white/25 focus-visible:ring-white/15"
              id="newPassword"
              type="password"
              {...form.register("newPassword")}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wide text-zinc-400" htmlFor="confirmNewPassword">
              {t("auth.confirmPassword")}
            </Label>
            <Input
              autoComplete="new-password"
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:border-white/25 focus-visible:ring-white/15"
              id="confirmNewPassword"
              type="password"
              {...form.register("confirmNewPassword")}
            />
          </div>

          {form.formState.errors.newPassword ||
          form.formState.errors.confirmNewPassword ? (
            <div className="flex gap-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div>
                {form.formState.errors.confirmNewPassword?.message ??
                  "New password must be at least 8 characters."}
              </div>
            </div>
          ) : null}

          <Button
            className="h-10 w-full gap-2 bg-white text-zinc-950 shadow-lg shadow-white/10 hover:bg-zinc-200"
            disabled={changePasswordMutation.isPending}
            type="submit"
          >
            {changePasswordMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <KeyRound className="size-4" />
            )}
            {t("auth.changePassword")}
          </Button>
        </form>
      </div>
    </main>
  );
}
