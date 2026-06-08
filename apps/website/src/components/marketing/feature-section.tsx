import {
  Activity,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  ServerCog,
  UsersRound,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    title: "Server Inventory",
    description:
      "Track hosts, services, ownership, and operational context from a single source of truth.",
    icon: ServerCog,
  },
  {
    title: "Agent Management",
    description:
      "Enroll Go-based agents, watch heartbeats, and understand where your infrastructure is reachable.",
    icon: Activity,
  },
  {
    title: "Monitoring",
    description:
      "Surface health signals and infrastructure checks without scattering visibility across tools.",
    icon: Gauge,
  },
  {
    title: "User & Role Management",
    description:
      "Keep access organized with users, roles, and future-ready permissions for shared homelabs.",
    icon: UsersRound,
  },
  {
    title: "Audit Logging",
    description:
      "Record important operational actions so changes are easier to review and reason about.",
    icon: ClipboardList,
  },
  {
    title: "Modern Dashboard",
    description:
      "Use a focused Next.js interface designed for repeatable infrastructure operations.",
    icon: LayoutDashboard,
  },
]

export function FeatureSection() {
  return (
    <section id="features" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-300">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            Built for the operational layer of a homelab.
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-400">
            Kyvora brings the pieces you already manage by hand into one clear
            control surface.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="rounded-lg border-white/10 bg-white/[0.03] transition-colors hover:border-emerald-300/35 hover:bg-white/[0.05]"
            >
              <CardHeader>
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-neutral-900 text-emerald-200">
                  <feature.icon className="size-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-white">{feature.title}</CardTitle>
                <CardDescription className="leading-6 text-neutral-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
