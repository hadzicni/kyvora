"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Eye, EyeOff, KeyRound, Loader2, Lock } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "@/lib/toast";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useChangePassword } from "@/features/users/use-users";
import { errorMessage } from "@/lib/api/client";

// ─── Particle canvas (identical to login) ─────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    interface Particle { x: number; y: number; r: number; vx: number; vy: number; alpha: number; }

    let W = 0, H = 0;
    let particles: Particle[] = [];
    let raf: number;

    const make = (): Particle => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      alpha: Math.random() * 0.35 + 0.05,
    });

    const resize = () => {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      particles = Array.from({ length: 90 }, make);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const p of particles) {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(139,92,246,${p.alpha})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H)
          Object.assign(p, make(), { x: Math.random() * W, y: Math.random() * H });
      }
      raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas); resize(); draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true" />
  );
}

// ─── Schema ───────────────────────────────────────────────────────────────────

type ChangePasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForcedPasswordChangePage() {
  const t = useTranslations();
  const router = useRouter();
  const { data: session, update } = useSession();
  const changePasswordMutation = useChangePassword();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const changePasswordSchema = useMemo(
    () =>
      z
        .object({
          currentPassword: z.string().min(1, t("auth.currentPasswordRequired")),
          newPassword: z.string().min(8, t("auth.newPasswordMin")),
          confirmNewPassword: z.string().min(8, t("auth.newPasswordMin")),
        })
        .refine((value) => value.newPassword === value.confirmNewPassword, {
          message: t("auth.passwordsDoNotMatch"),
          path: ["confirmNewPassword"],
        }),
    [t]
  );

  const form = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
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
        toast.success(t("auth.passwordChangedSignInAgain"));
        router.replace("/login");
        return;
      }
      await update();
      toast.success(t("auth.passwordChanged"));
      router.replace("/"); router.refresh();
    } catch (error) {
      toast.error(errorMessage(error) ?? t("auth.passwordChangeFailed"));
    }
  }

  const isPending = changePasswordMutation.isPending;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05070a] px-4 py-10 text-white">
      <ParticleCanvas />

      {/* Aurora glow */}
      <div
        className="absolute inset-0 animate-aurora"
        style={{
          background: [
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.32) 0%, transparent 60%)",
            "radial-gradient(ellipse 45% 45% at 15% 30%, rgba(20,184,166,0.16) 0%, transparent 55%)",
            "radial-gradient(ellipse 35% 30% at 85% 15%, rgba(139,92,246,0.14) 0%, transparent 50%)",
            "radial-gradient(ellipse 20% 20% at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 50%)",
          ].join(","),
        }}
        aria-hidden="true"
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px)",
          ].join(","),
          backgroundSize: "44px 44px",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-[420px] animate-card-in"
        style={{
          background: "rgba(10, 12, 18, 0.88)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "24px",
          padding: "2.5rem 2rem 2.25rem",
          backdropFilter: "blur(36px)",
          WebkitBackdropFilter: "blur(36px)",
          boxShadow: [
            "0 0 0 1px rgba(99,102,241,0.14)",
            "0 32px 64px rgba(0,0,0,0.65)",
            "0 0 80px rgba(99,102,241,0.07)",
          ].join(", "),
        }}
      >
        {/* Top-edge highlight */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: "62%", height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.75), rgba(99,102,241,0.95), rgba(139,92,246,0.75), transparent)",
            borderRadius: "999px",
          }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-3">
            <div
              className="flex size-9 items-center justify-center rounded-[10px]"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 22px rgba(99,102,241,0.5)" }}
            >
              <Image src="/icon.svg" alt="" width={22} height={22} priority aria-hidden="true" className="size-[22px]" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-white">Kyvora</span>
          </div>
          <h1 className="text-[26px] font-semibold tracking-[-0.03em] text-white">
            {t("auth.changePassword")}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-white/38">
            {t("auth.temporaryPasswordIssued")}
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
          {/* Current password */}
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword" className="block text-[11px] font-medium uppercase tracking-[0.1em] text-white/35">
              {t("auth.currentPassword")}
            </Label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/25 pointer-events-none" aria-hidden="true" />
              <Input
                id="currentPassword" type={showCurrent ? "text" : "password"} autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 rounded-xl border-white/8 bg-white/[0.045] pl-10 pr-10 text-white placeholder:text-white/18 focus-visible:border-violet-400/50 focus-visible:bg-indigo-500/[0.07] focus-visible:ring-[3px] focus-visible:ring-indigo-500/12"
                {...form.register("currentPassword")}
              />
              <button type="button" onClick={() => setShowCurrent((v) => !v)} aria-label={showCurrent ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/25 transition-colors hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                {showCurrent ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword" className="block text-[11px] font-medium uppercase tracking-[0.1em] text-white/35">
              {t("auth.newPassword")}
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/25 pointer-events-none" aria-hidden="true" />
              <Input
                id="newPassword" type={showNew ? "text" : "password"} autoComplete="new-password"
                placeholder={t("auth.minCharacters")}
                className="h-11 rounded-xl border-white/8 bg-white/[0.045] pl-10 pr-10 text-white placeholder:text-white/18 focus-visible:border-violet-400/50 focus-visible:bg-indigo-500/[0.07] focus-visible:ring-[3px] focus-visible:ring-indigo-500/12"
                {...form.register("newPassword")}
              />
              <button type="button" onClick={() => setShowNew((v) => !v)} aria-label={showNew ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/25 transition-colors hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                {showNew ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword" className="block text-[11px] font-medium uppercase tracking-[0.1em] text-white/35">
              {t("auth.confirmPassword")}
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/25 pointer-events-none" aria-hidden="true" />
              <Input
                id="confirmNewPassword" type={showConfirm ? "text" : "password"} autoComplete="new-password"
                placeholder={t("auth.repeatNewPassword")}
                className="h-11 rounded-xl border-white/8 bg-white/[0.045] pl-10 pr-10 text-white placeholder:text-white/18 focus-visible:border-violet-400/50 focus-visible:bg-indigo-500/[0.07] focus-visible:ring-[3px] focus-visible:ring-indigo-500/12"
                {...form.register("confirmNewPassword")}
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? t("auth.hidePassword") : t("auth.showPassword")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/25 transition-colors hover:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500">
                {showConfirm ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {(form.formState.errors.newPassword || form.formState.errors.confirmNewPassword) && (
            <div role="alert" className="flex gap-3 rounded-xl px-3.5 py-3 text-sm text-red-200"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.25)", animation: "shake 0.4s ease" }}>
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <div className="space-y-0.5">
                <p className="font-medium">{t("auth.passwordError")}</p>
                <p className="text-red-200/80">
                  {form.formState.errors.confirmNewPassword?.message ?? t("auth.newPasswordMin")}
                </p>
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={isPending}
            className="relative h-11 w-full overflow-hidden rounded-xl text-sm font-medium text-white transition-all duration-150 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)",
              boxShadow: "0 4px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(139,92,246,0.3)",
            }}>
            <span className="absolute inset-0 animate-shimmer"
              style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)" }}
              aria-hidden="true" />
            <span className="absolute inset-0"
              style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 60%)", borderRadius: "inherit" }}
              aria-hidden="true" />
            <span className="relative flex items-center justify-center gap-2">
              {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <KeyRound className="size-4" aria-hidden="true" />}
              {t("auth.changePassword")}
            </span>
          </button>
        </form>

        {/* Footer */}
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[11px] text-white/25">{t("auth.encryptionFooter")}</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
      </div>

      <style>{`
        @keyframes aurora { 0% { opacity:.8; transform:scale(1) translateY(0); } 100% { opacity:1; transform:scale(1.04) translateY(-8px); } }
        @keyframes card-in { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes shimmer { 0% { transform:translateX(-100%); } 40%,100% { transform:translateX(220%); } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
        .animate-aurora  { animation: aurora 8s ease-in-out infinite alternate; }
        .animate-card-in { animation: card-in 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        .animate-shimmer { animation: shimmer 2.8s infinite 1.2s; }
      `}</style>
    </main>
  );
}
