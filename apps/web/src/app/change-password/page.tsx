"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { KeyRound, Lock } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
  AuthAlert,
  AuthField,
  AuthShell,
  AuthSubmitButton,
} from "@/components/app/auth-shell"
import { useChangePassword } from "@/features/users/use-users"
import { errorMessage } from "@/lib/api/client"
import { toast } from "@/lib/toast"

type ChangePasswordValues = {
  confirmNewPassword: string
  currentPassword: string
  newPassword: string
}

export default function ForcedPasswordChangePage() {
  const t = useTranslations()
  const router = useRouter()
  const { data: session, update } = useSession()
  const changePasswordMutation = useChangePassword()
  const revealLabels = {
    hide: t("auth.hidePassword"),
    show: t("auth.showPassword"),
  }

  const changePasswordSchema = useMemo(
    () =>
      z
        .object({
          confirmNewPassword: z.string().min(8, t("auth.newPasswordMin")),
          currentPassword: z.string().min(1, t("auth.currentPasswordRequired")),
          newPassword: z.string().min(8, t("auth.newPasswordMin")),
        })
        .refine((value) => value.newPassword === value.confirmNewPassword, {
          message: t("auth.passwordsDoNotMatch"),
          path: ["confirmNewPassword"],
        }),
    [t],
  )

  const form = useForm<ChangePasswordValues>({
    defaultValues: { confirmNewPassword: "", currentPassword: "", newPassword: "" },
    resolver: zodResolver(changePasswordSchema),
  })

  async function onSubmit(values: ChangePasswordValues) {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      const result = await signIn("credentials", {
        callbackUrl: "/",
        email: session?.user.email,
        password: values.newPassword,
        redirect: false,
      })
      if (!result || result.error) {
        toast.success(t("auth.passwordChangedSignInAgain"))
        router.replace("/login")
        return
      }
      await update()
      toast.success(t("auth.passwordChanged"))
      router.replace("/")
      router.refresh()
    } catch (error) {
      toast.error(errorMessage(error) ?? t("auth.passwordChangeFailed"))
    }
  }

  const { errors } = form.formState
  const validationError = errors.newPassword ?? errors.confirmNewPassword

  return (
    <AuthShell
      footerNote={t("auth.encryptionFooter")}
      subtitle={t("auth.temporaryPasswordIssued")}
      title={t("auth.changePassword")}
    >
      <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
        <AuthField
          autoComplete="current-password"
          icon={Lock}
          id="currentPassword"
          label={t("auth.currentPassword")}
          placeholder="••••••••"
          revealLabels={revealLabels}
          type="password"
          {...form.register("currentPassword")}
        />
        <AuthField
          autoComplete="new-password"
          icon={KeyRound}
          id="newPassword"
          label={t("auth.newPassword")}
          placeholder={t("auth.minCharacters")}
          revealLabels={revealLabels}
          type="password"
          {...form.register("newPassword")}
        />
        <AuthField
          autoComplete="new-password"
          icon={KeyRound}
          id="confirmNewPassword"
          label={t("auth.confirmPassword")}
          placeholder={t("auth.repeatNewPassword")}
          revealLabels={revealLabels}
          type="password"
          {...form.register("confirmNewPassword")}
        />

        {validationError ? (
          <AuthAlert
            description={validationError.message ?? t("auth.newPasswordMin")}
            title={t("auth.passwordError")}
          />
        ) : null}

        <AuthSubmitButton icon={KeyRound} pending={changePasswordMutation.isPending}>
          {t("auth.changePassword")}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
