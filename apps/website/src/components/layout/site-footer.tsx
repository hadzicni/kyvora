import Link from "next/link"

import { siteConfig } from "@/config/site"
import { Separator } from "@/components/ui/separator"

const footerLinks = [
  {
    title: "GitHub",
    href: siteConfig.links.github,
  },
  {
    title: "Docs",
    href: siteConfig.links.docs,
  },
  {
    title: "Roadmap",
    href: siteConfig.links.roadmap,
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-neutral-950 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Separator className="bg-white/10" />
        <div className="flex flex-col gap-6 pt-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="flex size-7 items-center justify-center rounded-lg border border-emerald-400/30 bg-emerald-400/10 text-xs text-emerald-200">
                K
              </span>
              {siteConfig.name}
            </div>
            <p className="mt-3 text-sm leading-6 text-neutral-400">
              The open-source control plane for managing homelab servers,
              agents, monitoring, users, and infrastructure operations.
            </p>
          </div>
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md text-neutral-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-400/40"
              >
                {link.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
