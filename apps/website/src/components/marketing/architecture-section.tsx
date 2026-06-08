import { Container, Database, Layers3, MonitorCog, Router } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const architectureItems = [
  {
    title: "Modular monolith backend",
    description:
      "A Spring Boot API keeps domain boundaries clear while remaining simple to run and evolve.",
    icon: Layers3,
  },
  {
    title: "Next.js dashboard",
    description:
      "The authenticated dashboard is built as a modern web app for day-to-day operations.",
    icon: MonitorCog,
  },
  {
    title: "Go-based agent",
    description:
      "A lightweight agent reports host state and provides a foundation for future operations.",
    icon: Router,
  },
  {
    title: "PostgreSQL persistence",
    description:
      "Core inventory, users, audit data, and operational state are backed by PostgreSQL.",
    icon: Database,
  },
  {
    title: "Docker-first deployment",
    description:
      "Local and self-hosted environments are designed around containerized deployment paths.",
    icon: Container,
  },
]

export function ArchitectureSection() {
  return (
    <section id="architecture" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Badge
              variant="outline"
              className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
            >
              Architecture
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Familiar building blocks, composed for self-hosting.
            </h2>
          </div>
          <p className="text-base leading-7 text-neutral-400">
            Kyvora uses boring, durable infrastructure choices so the control
            plane stays understandable: a modular backend, a Next.js interface,
            a Go agent, PostgreSQL, and Docker-first deployment.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {architectureItems.map((item) => (
            <Card
              key={item.title}
              className="rounded-lg border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.025]"
            >
              <CardHeader>
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-white/8 text-emerald-200">
                  <item.icon className="size-4" aria-hidden="true" />
                </div>
                <CardTitle className="text-sm text-white">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-6 text-neutral-400">
                  {item.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
