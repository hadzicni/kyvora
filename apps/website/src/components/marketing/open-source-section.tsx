import Link from "next/link"
import {
  ArrowUpRight,
  FileCheck2,
  GitBranch,
  HeartHandshake,
  Scale,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { siteConfig } from "@/config/site"

const trustLinks = [
  {
    title: "GitHub Repository",
    description: "Inspect the source, follow development, and open issues or pull requests.",
    href: siteConfig.links.github,
    label: "Source",
    icon: GitBranch,
  },
  {
    title: "Contributing Guide",
    description: "Learn how to set up the monorepo, run checks, and contribute changes.",
    href: siteConfig.links.contributing,
    label: "Contribute",
    icon: FileCheck2,
  },
  {
    title: "Code of Conduct",
    description: "Understand the expectations for respectful and constructive collaboration.",
    href: siteConfig.links.codeOfConduct,
    label: "Community",
    icon: HeartHandshake,
  },
  {
    title: "Security Policy",
    description: "Report vulnerabilities responsibly without disclosing sensitive details publicly.",
    href: siteConfig.links.security,
    label: "Security",
    icon: ShieldCheck,
  },
  {
    title: "License",
    description: "Review Kyvora’s MIT open-source license.",
    href: siteConfig.links.license,
    label: "MIT",
    icon: Scale,
  },
]

export function OpenSourceSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="open-source-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Badge
              variant="outline"
              className="border-sky-300/25 bg-sky-300/10 text-sky-200"
            >
              Open source
            </Badge>
            <h2
              id="open-source-title"
              className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl"
            >
              Built in the open.
            </h2>
          </div>
          <div>
            <p className="text-base leading-7 text-neutral-400">
              Kyvora is developed as a transparent open-source infrastructure
              project. Follow the roadmap, inspect the code, contribute
              improvements, or report security issues responsibly.
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mt-5 border-white/15 bg-white/[0.03] text-neutral-100 hover:bg-white/10"
            >
              <Link
                href={siteConfig.links.contributing}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read contributing guide
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {trustLinks.map((item) => (
            <Card
              key={item.title}
              className="rounded-lg border-white/10 bg-neutral-900/60 transition-colors hover:border-sky-300/35 hover:bg-neutral-900"
            >
              <CardHeader>
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-sky-300/10 text-sky-200">
                  <item.icon className="size-5" aria-hidden="true" />
                </div>
                <Badge
                  variant="outline"
                  className="mb-2 border-white/10 bg-white/[0.03] text-neutral-300"
                >
                  {item.label}
                </Badge>
                <CardTitle className="text-white">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <CardDescription className="leading-6 text-neutral-400">
                  {item.description}
                </CardDescription>
                <Link
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1 rounded-md text-sm font-medium text-sky-200 outline-none transition-colors hover:text-sky-100 focus-visible:ring-3 focus-visible:ring-sky-400/40"
                  aria-label={`Open ${item.title}`}
                >
                  Open
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
