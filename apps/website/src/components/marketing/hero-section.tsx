import Link from "next/link"
import { ArrowRight, GitBranch, Server, ShieldCheck } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const trustIndicators = ["Open source", "Self-hosted", "Built for homelabs"]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(16,185,129,0.22),transparent_28%),radial-gradient(circle_at_84%_8%,rgba(56,189,248,0.18),transparent_24%),linear-gradient(180deg,rgba(10,10,10,0)_0%,rgb(10,10,10)_86%)]" />
      <div className="absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-emerald-300/50 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <div>
          <div className="flex flex-wrap gap-2">
            {trustIndicators.map((indicator) => (
              <Badge
                key={indicator}
                variant="outline"
                className="border-white/15 bg-white/[0.04] text-neutral-200"
              >
                {indicator}
              </Badge>
            ))}
          </div>

          <h1 className="mt-7 max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
            The open-source control plane for your homelab.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-300 sm:text-xl">
            Manage servers, agents, monitoring, users, and infrastructure
            operations from one modern dashboard.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-11 bg-emerald-300 px-4 text-neutral-950 hover:bg-emerald-200"
            >
              <Link href={siteConfig.links.docs} target="_blank" rel="noopener noreferrer">
                Get Started
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 border-white/15 bg-white/[0.03] px-4 text-neutral-100 hover:bg-white/10"
            >
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitBranch aria-hidden="true" />
                View on GitHub
              </Link>
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-emerald-400/15 via-sky-400/10 to-fuchsia-400/10 blur-2xl" />
          <div className="rounded-xl border border-white/10 bg-neutral-950/80 p-3 shadow-2xl shadow-black/50 backdrop-blur">
            <div className="rounded-lg border border-white/10 bg-neutral-900">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-red-400/80" />
                  <span className="size-2.5 rounded-full bg-amber-300/80" />
                  <span className="size-2.5 rounded-full bg-emerald-300/80" />
                </div>
                <Badge className="bg-sky-300/10 text-sky-200" variant="outline">
                  live control plane
                </Badge>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[0.75fr_1.25fr]">
                <div className="space-y-3">
                  {["Inventory", "Agents", "Monitoring", "Access"].map(
                    (item, index) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5"
                      >
                        <span className="flex size-7 items-center justify-center rounded-md bg-emerald-300/10 text-emerald-200">
                          {index === 0 ? (
                            <Server className="size-3.5" aria-hidden="true" />
                          ) : (
                            <ShieldCheck className="size-3.5" aria-hidden="true" />
                          )}
                        </span>
                        <span className="text-sm text-neutral-200">{item}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="rounded-lg border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Homelab status
                      </p>
                      <p className="text-xs text-neutral-500">
                        Agents, services, and access at a glance
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-xs text-emerald-200">
                      healthy
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      ["12", "servers"],
                      ["10", "agents"],
                      ["4", "roles"],
                    ].map(([value, label]) => (
                      <div
                        key={label}
                        className="rounded-lg border border-white/10 bg-white/[0.03] p-3"
                      >
                        <p className="text-2xl font-semibold text-white">
                          {value}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">{label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      ["kyvora-agent-01", "heartbeat 12s ago", "bg-emerald-300"],
                      ["storage-node", "disk check queued", "bg-sky-300"],
                      ["audit stream", "3 events pending", "bg-amber-300"],
                    ].map(([name, detail, color]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`size-2 rounded-full ${color}`} />
                          <span className="text-sm text-neutral-200">{name}</span>
                        </div>
                        <span className="text-xs text-neutral-500">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
