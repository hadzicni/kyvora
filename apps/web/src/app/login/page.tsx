"use client";

import { AlertCircle, Loader2, LogIn } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supportedLocales } from "@/i18n/config";
import { useLocalePreference } from "@/i18n/locale-provider";

export default function LoginPage() {
  const t = useTranslations();
  const { locale, setLocale } = useLocalePreference();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(session?.user.mustChangePassword ? "/change-password" : "/");
    }
  }, [router, session?.user.mustChangePassword, status]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070a] px-4 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.20),transparent_32%),radial-gradient(circle_at_20%_25%,rgba(20,184,166,0.10),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.055),transparent_35%)]" />
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
            {t("auth.welcomeBack")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            {t("auth.loginSubtitle")}
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
              setError(t("auth.invalidCredentials"));
              return;
            }

            router.refresh();
            router.replace(result.url ?? "/");
          }}
        >
          <div className="space-y-1.5">
            <Label
              className="text-xs font-medium uppercase tracking-wide text-zinc-400"
              htmlFor="email"
            >
              {t("auth.email")}
            </Label>
            <Input
              autoComplete="email"
              id="email"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@kyvora.local"
              required
              type="email"
              value={email}
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:border-white/25 focus-visible:ring-white/15"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              className="text-xs font-medium uppercase tracking-wide text-zinc-400"
              htmlFor="password"
            >
              {t("auth.password")}
            </Label>
            <Input
              autoComplete="current-password"
              id="password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("auth.passwordPlaceholder")}
              required
              type="password"
              value={password}
              className="h-10 border-white/10 bg-white/5 text-white placeholder:text-zinc-600 focus-visible:border-white/25 focus-visible:ring-white/15"
            />
          </div>

          {error ? (
            <div
              className="flex gap-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-3 text-sm text-red-200"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">{t("auth.signInFailed")}</p>
                <p className="text-red-200/80">{error}</p>
              </div>
            </div>
          ) : null}

          <Button
            className="h-10 w-full gap-2 bg-white text-zinc-950 shadow-lg shadow-white/10 hover:bg-zinc-200"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {t("auth.signIn")}
          </Button>
        </form>
      </div>
    </main>
  );
}
