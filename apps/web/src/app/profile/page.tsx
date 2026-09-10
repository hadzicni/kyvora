"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, BadgeCheck, LogOut } from "lucide-react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "@/lib/toast"
import { z } from "zod"

import { AppShell } from "@/components/app/app-shell"
import { DetailLayout } from "@/components/app/detail-layout"
import { PageHeader } from "@/components/app/page-header"
import { InfoList, InfoRow, PageSection } from "@/components/app/page-section"
import { SectionState } from "@/components/app/section-state"
import { StatusBadge } from "@/components/app/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useChangePassword } from "@/features/users/use-users"
import { getStatus, statusKeys } from "@/lib/api/status"
import { UsersApiError } from "@/lib/api/users"

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmNewPassword: z.string().min(8),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })

type ChangePasswordValues = z.output<typeof changePasswordSchema>

async function logout() {
  await fetch("/api/session/logout", { method: "POST" }).catch(() => {
    // Auth.js session cleanup should continue even if backend revocation fails.
  })

  await signOut({ callbackUrl: "/login" })
}

function ProfileLoadingState() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2 border-b border-border pb-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-52 w-full" />
          </div>
        </div>
      </div>
    </AppShell>
  )
}

export default function ProfilePage() {
  const t = useTranslations()
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const statusQuery = useQuery({
    queryKey: statusKeys.status,
    queryFn: getStatus,
    enabled: status === "authenticated",
  })
  const changePasswordMutation = useChangePassword()
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    }
  }, [router, status])

  if (status === "loading") {
    return <ProfileLoadingState />
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <AppShell>
        <SectionState
          description="Redirecting to sign in before showing profile details."
          icon={<AlertTriangle className="size-5" />}
          title="Authentication required"
          tone="danger"
        />
      </AppShell>
    )
  }

  const { user } = session

  async function onChangePassword(values: ChangePasswordValues) {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      if (user.email) {
        await signIn("credentials", {
          email: user.email,
          password: values.newPassword,
          redirect: false,
          callbackUrl: "/profile",
        })
        await update()
      }
      passwordForm.reset()
      toast.success("Password changed")
    } catch (error) {
      if (error instanceof UsersApiError && error.details.length > 0) {
        toast.error(`${error.message}: ${error.details.join(", ")}`)
        return
      }
      toast.error(error instanceof Error ? error.message : "Password change failed")
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            <Badge className="w-fit" variant="outline">
              <BadgeCheck className="size-3" />
              {user.permissions.length
                ? t("permissions.summary", { count: user.permissions.length })
                : t("common.authenticated")}
            </Badge>
          }
          subtitle={t("profile.subtitle")}
          title={t("profile.title")}
        />

        <DetailLayout
          aside={
            <>
              <PageSection
                description={t("profile.securityDescription")}
                title={t("profile.security")}
              >
                <InfoList>
                  <InfoRow
                    label={t("profile.sessionStatus")}
                    value={
                      <StatusBadge tone="success">{t("common.authenticated")}</StatusBadge>
                    }
                  />
                  <InfoRow
                    label={t("profile.authProvider")}
                    value={t("profile.credentials")}
                  />
                  <InfoRow
                    label={t("profile.tokenStorage")}
                    value={t("profile.tokenStorageDescription")}
                  />
                  <InfoRow
                    label={t("profile.version")}
                    mono
                    value={
                      statusQuery.data?.version ??
                      (statusQuery.isLoading
                        ? `${t("common.loading")}...`
                        : t("common.unavailable"))
                    }
                  />
                </InfoList>
              </PageSection>

              <PageSection
                description={t("profile.accountActionsDescription")}
                title={t("profile.accountActions")}
              >
                <Button
                  className="w-full justify-center"
                  onClick={() => {
                    toast.info(t("auth.signingOut"))
                    void logout()
                  }}
                  variant="destructive"
                >
                  <LogOut className="size-4" />
                  {t("profile.logOut")}
                </Button>
              </PageSection>
            </>
          }
        >
          <PageSection
            description={t("profile.userInformationDescription")}
            title={t("profile.userInformation")}
          >
            <InfoList className="max-w-2xl">
              <InfoRow
                label={t("forms.displayName")}
                value={user.displayName || t("common.notProvided")}
              />
              <InfoRow
                label={t("users.email")}
                value={user.email || t("common.notProvided")}
              />
              <InfoRow
                label={t("permissions.title")}
                value={
                  user.permissions.length ? (
                    <span className="flex flex-wrap justify-end gap-1">
                      {user.permissions.map((permission) => (
                        <Badge key={permission} variant="outline">
                          {t(`permissions.items.${permission}`)}
                        </Badge>
                      ))}
                    </span>
                  ) : (
                    t("common.notProvided")
                  )
                }
              />
              <InfoRow label="User ID" mono value={user.id || t("common.unavailable")} />
            </InfoList>
          </PageSection>

          <PageSection
            description={t("profile.changePasswordDescription")}
            title={t("auth.changePassword")}
          >
            <form
              className="max-w-md space-y-4"
              onSubmit={passwordForm.handleSubmit(onChangePassword)}
            >
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t("auth.currentPassword")}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register("currentPassword")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register("newPassword")}
                />
                {passwordForm.formState.errors.newPassword ? (
                  <p className="text-xs text-destructive">{t("auth.newPasswordMin")}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">{t("auth.confirmPassword")}</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  {...passwordForm.register("confirmNewPassword")}
                />
                {passwordForm.formState.errors.confirmNewPassword ? (
                  <p className="text-xs text-destructive">
                    {passwordForm.formState.errors.confirmNewPassword.message}
                  </p>
                ) : null}
              </div>
              <Button disabled={changePasswordMutation.isPending} type="submit">
                {t("auth.changePassword")}
              </Button>
            </form>
          </PageSection>
        </DetailLayout>
      </div>
    </AppShell>
  )
}
