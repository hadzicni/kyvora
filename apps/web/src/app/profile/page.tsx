"use client";

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
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app/app-shell";
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
import { getStatus, statusKeys } from "@/lib/api/status";

async function logout() {
  toast.info("Signing out...");

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
  const router = useRouter();
  const { data: session, status } = useSession();
  const statusQuery = useQuery({
    queryKey: statusKeys.status,
    queryFn: getStatus,
    enabled: status === "authenticated",
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

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Account identity and session security details.
            </p>
          </div>
          <Badge className="w-fit" variant="outline">
            <BadgeCheck className="size-3" />
            {user.role || "Authenticated"}
          </Badge>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="size-4" />
                User information
              </CardTitle>
              <CardDescription>
                Safe fields exposed by the current Auth.js session.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <ProfileField
                label="Display name"
                value={user.displayName || "Not provided"}
              />
              <ProfileField label="Email" value={user.email || "Not provided"} />
              <ProfileField label="Role" value={user.role || "Not assigned"} />
              <ProfileField label="User ID" value={user.id || "Unavailable"} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  Security
                </CardTitle>
                <CardDescription>
                  Session handling for this signed-in browser.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <BadgeCheck className="mt-0.5 size-4 text-emerald-400" />
                  <div>
                    <div className="text-sm font-medium">Session status</div>
                    <div className="text-sm text-muted-foreground">
                      Authenticated
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <Fingerprint className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">
                      Authentication provider
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Credentials
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <ShieldCheck className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Token storage</div>
                    <div className="text-sm text-muted-foreground">
                      Managed by Auth.js session cookies
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-md border bg-muted/20 p-3">
                  <GitBranch className="mt-0.5 size-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">Kyvora version</div>
                    <div className="text-sm text-muted-foreground">
                      {statusQuery.data?.version ??
                        (statusQuery.isLoading ? "Loading..." : "Unavailable")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" />
                  Account actions
                </CardTitle>
                <CardDescription>
                  End this browser session and return to sign in.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full justify-center"
                  onClick={() => void logout()}
                  variant="destructive"
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
