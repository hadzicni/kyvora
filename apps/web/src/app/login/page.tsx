"use client";

import { Loader2, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("admin@kyvora.local");
  const [password, setPassword] = useState("admin-password");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/70 bg-card/95 shadow-2xl shadow-black/30">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">Kyvora</CardTitle>
          <CardDescription>
            Sign in with your backend credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setIsSubmitting(true);
              setError(null);

              const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
                callbackUrl: "/",
              });

              setIsSubmitting(false);

              if (!result || result.error) {
                setError("Invalid email or password.");
                return;
              }

              router.replace(result.url ?? "/");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                autoComplete="email"
                id="email"
                name="email"
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                autoComplete="current-password"
                id="password"
                name="password"
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                value={password}
              />
            </div>

            {error ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            ) : null}

            <Button className="w-full" disabled={isSubmitting} type="submit">
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogIn className="size-4" />
              )}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
