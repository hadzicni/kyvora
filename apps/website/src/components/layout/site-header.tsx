import Link from "next/link"
import { ArrowRight, GitBranch } from "lucide-react"

import { siteConfig } from "@/config/site"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-85 focus-visible:ring-3 focus-visible:ring-emerald-400/40"
          aria-label="Kyvora home"
        >
          <span className="flex size-8 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-sm font-semibold text-emerald-200 shadow-[0_0_32px_rgba(52,211,153,0.18)]">
            K
          </span>
          <span className="text-sm font-semibold tracking-wide text-white">
            {siteConfig.name}
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 md:flex"
        >
          {siteConfig.mainNav.map((item) => (
            <Button key={item.title} variant="ghost" size="sm" asChild>
              <Link
                href={item.href}
                className="text-neutral-300 hover:text-white"
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={
                  item.href.startsWith("http") ? "noopener noreferrer" : undefined
                }
              >
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden border-white/15 bg-white/[0.03] text-neutral-100 hover:bg-white/10 sm:inline-flex"
          >
            <Link
              href={siteConfig.links.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View Kyvora on GitHub"
            >
              <GitBranch aria-hidden="true" />
            </Link>
          </Button>
          <Button
            size="sm"
            asChild
            className="bg-emerald-300 text-neutral-950 hover:bg-emerald-200"
          >
            <Link href={siteConfig.links.docs} target="_blank" rel="noopener noreferrer">
              Get Started
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
