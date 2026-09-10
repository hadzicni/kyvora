"use client"

import { Lock, LogIn, Mail } from "lucide-react"
import { signIn, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

import {
  AuthAlert,
  AuthField,
  AuthShell,
  AuthSubmitButton,
} from "@/components/app/auth-shell"

export default function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const { data: session, status } = useSession()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(session?.user.mustChangePassword ? "/change-password" : "/")
    }
  }, [router, session?.user.mustChangePassword, status])

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      setIsSubmitting(true)
      setError(null)

      const result = await signIn("credentials", {
        callbackUrl: "/",
        email,
        password,
        redirect: false,
      })

      setIsSubmitting(false)

      if (!result || result.error) {
        setError(t("auth.invalidCredentials"))
        return
      }

      router.refresh()
      router.replace(result.url ?? "/")
    },
    [email, password, router, t],
  )

  return (
    <AuthShell
      footerNote={t("auth.encryptionFooter")}
      subtitle={t("auth.loginSubtitle")}
      title={t("auth.welcomeBack")}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthField
          autoComplete="email"
          icon={Mail}
          id="email"
          label={t("auth.email")}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@kyvora.local"
          required
          type="email"
          value={email}
        />
        <AuthField
          autoComplete="current-password"
          icon={Lock}
          id="password"
          label={t("auth.password")}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t("auth.passwordPlaceholder")}
          required
          revealLabels={{ hide: t("auth.hidePassword"), show: t("auth.showPassword") }}
          type="password"
          value={password}
        />

        {error ? <AuthAlert description={error} title={t("auth.signInFailed")} /> : null}

        <AuthSubmitButton icon={LogIn} pending={isSubmitting}>
          {t("auth.signIn")}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  )
}
