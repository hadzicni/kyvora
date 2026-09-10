"use client"

import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import Image from "next/image"
import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// ─── Ambient background ───────────────────────────────────────────────────────

function ParticleField() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)

  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    type Particle = {
      alpha: number
      r: number
      vx: number
      vy: number
      x: number
      y: number
    }

    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0

    const make = (): Particle => ({
      alpha: Math.random() * 0.35 + 0.05,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      x: Math.random() * width,
      y: Math.random() * height,
    })

    const paint = (advance: boolean) => {
      ctx.clearRect(0, 0, width, height)
      for (const particle of particles) {
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139,92,246,${particle.alpha})`
        ctx.fill()
        if (!advance) continue
        particle.x += particle.vx
        particle.y += particle.vy
        if (
          particle.x < 0 ||
          particle.x > width ||
          particle.y < 0 ||
          particle.y > height
        ) {
          Object.assign(particle, make())
        }
      }
    }

    const resize = () => {
      width = canvas.width = canvas.offsetWidth
      height = canvas.height = canvas.offsetHeight
      particles = Array.from({ length: 90 }, make)
      if (reduceMotion) paint(false)
    }

    const animate = () => {
      paint(true)
      frame = requestAnimationFrame(animate)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    resize()
    if (!reduceMotion) animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  return (
    <canvas
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full"
      ref={canvasRef}
    />
  )
}

const auroraLayers = [
  "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(99,102,241,0.32) 0%, transparent 60%)",
  "radial-gradient(ellipse 45% 45% at 15% 30%, rgba(20,184,166,0.16) 0%, transparent 55%)",
  "radial-gradient(ellipse 35% 30% at 85% 15%, rgba(139,92,246,0.14) 0%, transparent 50%)",
  "radial-gradient(ellipse 20% 20% at 80% 80%, rgba(99,102,241,0.08) 0%, transparent 50%)",
].join(",")

const gridLayers = [
  "linear-gradient(rgba(255,255,255,0.032) 1px, transparent 1px)",
  "linear-gradient(90deg, rgba(255,255,255,0.032) 1px, transparent 1px)",
].join(",")

const gridMask =
  "radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 75%)"

// ─── Shell ────────────────────────────────────────────────────────────────────

/**
 * The full-bleed surface behind every unauthenticated screen. Sign-in and the
 * forced password change share it so the product has one front door, not two.
 */
export function AuthShell({
  children,
  footerNote,
  subtitle,
  title,
}: {
  children: React.ReactNode
  footerNote?: React.ReactNode
  subtitle: React.ReactNode
  title: React.ReactNode
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--auth-canvas)] px-4 py-10 text-white">
      <ParticleField />

      <div
        aria-hidden="true"
        className="absolute inset-0 animate-aurora"
        style={{ background: auroraLayers }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage: gridLayers,
          backgroundSize: "44px 44px",
          maskImage: gridMask,
          WebkitMaskImage: gridMask,
        }}
      />

      <div className="relative z-10 w-full max-w-[420px] animate-card-in rounded-3xl border border-white/8 bg-[var(--auth-card)] px-8 pb-9 pt-10 shadow-[0_32px_64px_rgba(0,0,0,0.65)] backdrop-blur-3xl">
        {/* Top-edge highlight */}
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-0 h-px w-[62%] -translate-x-1/2 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(139,92,246,0.75), rgba(99,102,241,0.95), rgba(139,92,246,0.75), transparent)",
          }}
        />

        <header className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-brand shadow-[0_0_22px_var(--brand-muted)]">
              <Image
                alt=""
                aria-hidden="true"
                className="size-[22px]"
                height={22}
                priority
                src="/icon.svg"
                width={22}
              />
            </span>
            <span className="text-xl font-semibold tracking-tight">Kyvora</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm leading-6 text-white/40">{subtitle}</p>
        </header>

        {children}

        {footerNote ? (
          <div className="mt-5 flex items-center gap-3">
            <span aria-hidden="true" className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-[11px] text-white/30">{footerNote}</span>
            <span aria-hidden="true" className="h-px flex-1 bg-white/[0.06]" />
          </div>
        ) : null}
      </div>
    </main>
  )
}

// ─── Field ────────────────────────────────────────────────────────────────────

const authInputClasses =
  "h-11 rounded-xl border-white/8 bg-white/[0.045] pl-10 text-white placeholder:text-white/20 focus-visible:border-brand/60 focus-visible:bg-brand/[0.07] focus-visible:ring-3 focus-visible:ring-brand/20"

/**
 * A labelled auth input. Extra props are forwarded to the underlying input, so
 * it works with both controlled state and React Hook Form's `register`.
 */
export const AuthField = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    icon: React.ComponentType<{ className?: string }>
    id: string
    label: React.ReactNode
    revealLabels?: { hide: string; show: string }
  }
>(function AuthField(
  { className, icon: Icon, id, label, revealLabels, type = "text", ...props },
  ref,
) {
  const [revealed, setRevealed] = React.useState(false)
  const revealable = type === "password" && revealLabels !== undefined

  return (
    <div className="space-y-1.5">
      <Label
        className="block text-[11px] font-medium uppercase tracking-[0.1em] text-white/40"
        htmlFor={id}
      >
        {label}
      </Label>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/30"
        />
        <Input
          className={cn(authInputClasses, revealable && "pr-10", className)}
          id={id}
          ref={ref}
          type={revealable && revealed ? "text" : type}
          {...props}
        />
        {revealable ? (
          <button
            aria-label={revealed ? revealLabels.hide : revealLabels.show}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/30 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            onClick={() => setRevealed((value) => !value)}
            type="button"
          >
            {revealed ? (
              <EyeOff aria-hidden="true" className="size-4" />
            ) : (
              <Eye aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : null}
      </div>
    </div>
  )
})

// ─── Alert ────────────────────────────────────────────────────────────────────

export function AuthAlert({
  description,
  title,
}: {
  description: React.ReactNode
  title: React.ReactNode
}) {
  return (
    <div
      className="flex animate-shake gap-3 rounded-xl border border-red-500/25 bg-red-600/10 px-3.5 py-3 text-sm text-red-200"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-0.5">
        <p className="font-medium">{title}</p>
        <p className="text-red-200/80">{description}</p>
      </div>
    </div>
  )
}

// ─── Submit ───────────────────────────────────────────────────────────────────

export function AuthSubmitButton({
  children,
  icon: Icon,
  pending = false,
}: {
  children: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  pending?: boolean
}) {
  return (
    <button
      className="relative h-11 w-full overflow-hidden rounded-xl text-sm font-medium text-white transition-transform duration-150 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand/50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      disabled={pending}
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #7c3aed 100%)",
        boxShadow: "0 4px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(139,92,246,0.3)",
      }}
      type="submit"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 animate-shimmer"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%)",
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 60%)",
        }}
      />
      <span className="relative flex items-center justify-center gap-2">
        {pending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Icon className="size-4" />
        )}
        {children}
      </span>
    </button>
  )
}
