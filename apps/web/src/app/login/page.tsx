"use client";

import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [router, status]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-md bg-foreground">
            <span className="text-xs font-bold text-background">K</span>
          </div>
          <span className="text-lg font-medium tracking-tight">Kyvora</span>
        </div>

        {/* Form */}
        <form
          className="space-y-5"
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
              setError("Please check your email and password, then try again.");
              return;
            }

            router.replace(result.url ?? "/");
          }}
        >
          <div className="space-y-1.5">
            <Label
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              htmlFor="email"
            >
              Email
            </Label>
            <Input
              autoComplete="email"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your Email"
              required
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
              htmlFor="password"
            >
              Password
            </Label>
            <Input
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your Password"
              required
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <div
              className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">Sign in failed</p>
                <p className="text-destructive/90">{error}</p>
              </div>
            </div>
          ) : null}

          <Button
            className="w-full gap-2"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            Sign in
          </Button>
        </form>

        <p className="text-xs text-muted-foreground">
          Sign in with your backend credentials to access the dashboard.
        </p>
      </div>
    </main>
  );
}
