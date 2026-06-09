"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  BadgeCheck,
  GitBranch,
  Fingerprint,
  LogOut,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app/app-shell";
import { PageHeader } from "@/components/app/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/features/users/use-users";
import { UsersApiError } from "@/lib/api/users";
import { getStatus, statusKeys } from "@/lib/api/status";

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

async function logout() {
  await fetch("/api/session/logout", { method: "POST" }).catch(() => {
    // Auth.js session cleanup should continue even if backend revocation fails.
  });

  await signOut({ callbackUrl: "/login" });
}

function ProfileField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-medium">{value}</div>
    </div>
  );
}

function ProfileLoadingState() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const statusQuery = useQuery({
    queryKey: statusKeys.status,
    queryFn: getStatus,
    enabled: status === "authenticated",
  });
  const changePasswordMutation = useChangePassword();
  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  if (status === "loading") {
    return <ProfileLoadingState />;
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <AppShell>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-destructive" />
              Authentication required
            </CardTitle>
            <CardDescription>
              Redirecting to sign in before showing profile details.
            </CardDescription>
          </CardHeader>
        </Card>
      </AppShell>
    );
  }

  const { user } = session;

  async function onChangePassword(values: ChangePasswordValues) {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      if (user.email) {
        await signIn("credentials", {
          email: user.email,
          password: values.newPassword,
          redirect: false,
          callbackUrl: "/profile",
        });
        await update();
      }
      passwordForm.reset();
      toast.success("Password changed");
    } catch (error) {
      if (error instanceof UsersApiError && error.details.length > 0) {
        toast.error(`${error.message}: ${error.details.join(", ")}`);
        return;
      }
      toast.error(error instanceof Error ? error.message : "Password change failed");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            <Badge className="w-fit" variant="outline">
              <BadgeCheck className="size-3" />
              {user.role ? t(`roles.${user.role}`) : t("common.authenticated")}
            </Badge>
          }
          subtitle={t("profile.subtitle")}
          title={t("profile.title")}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="size-4" />
                {t("profile.userInformation")}
              </CardTitle>
              <CardDescription>
                {t("profile.userInformationDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <ProfileField
                label={t("forms.displayName")}
                value={user.displayName || t("common.notProvided")}
              />
              <ProfileField label={t("users.email")} value={user.email || t("common.notProvided")} />
              <ProfileField
                label={t("forms.role")}
                value={user.role ? t(`roles.${user.role}`) : t("common.notProvided")}
              />
              <ProfileField label="User ID" value={user.id || t("common.unavailable")} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  {t("profile.security")}
                </CardTitle>
                <CardDescription>
                  {t("profile.securityDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <BadgeCheck className="mt-0.5 size-4 text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium">{t("profile.sessionStatus")}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("common.authenticated")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <Fingerprint className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      {t("profile.authProvider")}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t("profile.credentials")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{t("profile.tokenStorage")}</div>
                    <div className="text-sm text-muted-foreground">
                      {t("profile.tokenStorageDescription")}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <GitBranch className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{t("profile.version")}</div>
                    <div className="text-sm text-muted-foreground">
                      {statusQuery.data?.version ??
                        (statusQuery.isLoading
                          ? `${t("common.loading")}...`
                          : t("common.unavailable"))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  {t("auth.changePassword")}
                </CardTitle>
                <CardDescription>
                  {t("profile.changePasswordDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
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
                      <p className="text-xs text-destructive">
                        New password must be at least 8 characters.
                      </p>
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
                  <Button
                    className="w-full justify-center"
                    disabled={changePasswordMutation.isPending}
                    type="submit"
                  >
                    {t("auth.changePassword")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" />
                  {t("profile.accountActions")}
                </CardTitle>
                <CardDescription>
                  {t("profile.accountActionsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full justify-center"
                  onClick={() => {
                    toast.info(t("auth.signingOut"));
                    void logout();
                  }}
                  variant="destructive"
                >
                  <LogOut className="size-4" />
                  {t("profile.logOut")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
