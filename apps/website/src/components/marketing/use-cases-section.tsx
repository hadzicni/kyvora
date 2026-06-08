import { ArrowUpRight, Boxes, HeartPulse, RadioTower, SearchCheck } from "lucide-react"

const useCases = [
  {
    title: "Manage homelab servers",
    description:
      "Keep machine inventory, operational ownership, and service context easy to scan.",
    icon: Boxes,
  },
  {
    title: "Monitor self-hosted infrastructure",
    description:
      "Bring core health checks and infrastructure signals into the same workspace.",
    icon: HeartPulse,
  },
  {
    title: "Track agents and heartbeats",
    description:
      "Understand which agents are online, stale, or ready for operational work.",
    icon: RadioTower,
  },
  {
    title: "Centralize operational visibility",
    description:
      "Reduce context switching across dashboards, terminals, and one-off notes.",
    icon: SearchCheck,
  },
]

export function UseCasesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start">
        <div className="lg:sticky lg:top-24">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-300">
            Use cases
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            One place to run the infrastructure you own.
          </h2>
          <p className="mt-4 text-base leading-7 text-neutral-400">
            Kyvora is for homelab operators who want practical visibility and
            control without pretending their setup is a public cloud.
          </p>
        </div>

        <div className="grid gap-3">
          {useCases.map((useCase) => (
            <article
              key={useCase.title}
              className="group grid gap-4 rounded-lg border border-white/10 bg-neutral-900/60 p-5 transition-colors hover:border-sky-300/35 hover:bg-neutral-900 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-sky-300/10 text-sky-200">
                <useCase.icon className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="font-medium text-white">{useCase.title}</h3>
                <p className="mt-1 text-sm leading-6 text-neutral-400">
                  {useCase.description}
                </p>
              </div>
              <ArrowUpRight
                className="hidden size-4 text-neutral-600 transition-colors group-hover:text-sky-200 sm:block"
                aria-hidden="true"
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
