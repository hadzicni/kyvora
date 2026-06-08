import Link from "next/link"
import { ArrowRight, BookOpen, GitBranch } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(14,165,233,0.10)_44%,rgba(250,204,21,0.08))] p-6 sm:p-10 lg:p-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h2 className="max-w-3xl text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Start shaping your homelab control plane.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-300">
              Explore the repository, read the project docs, and follow the
              roadmap as Kyvora grows into a practical operations hub.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              size="lg"
              asChild
              className="h-11 bg-emerald-300 px-4 text-neutral-950 hover:bg-emerald-200"
            >
              <Link href={siteConfig.links.docs} target="_blank" rel="noopener noreferrer">
                <BookOpen aria-hidden="true" />
                Read Docs
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 border-white/15 bg-neutral-950/40 px-4 text-neutral-100 hover:bg-neutral-950/70"
            >
              <Link
                href={siteConfig.links.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <GitBranch aria-hidden="true" />
                View on GitHub
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
