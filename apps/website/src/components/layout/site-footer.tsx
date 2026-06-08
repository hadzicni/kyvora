import Link from "next/link"

import { siteConfig } from "@/config/site"
import { Separator } from "@/components/ui/separator"

const footerLinkGroups = [
  {
    title: "Developers",
    links: [
      {
        title: "GitHub",
        href: siteConfig.links.github,
      },
      {
        title: "Documentation",
        href: siteConfig.links.docs,
      },
      {
        title: "Contributing",
        href: siteConfig.links.contributing,
      },
      {
        title: "Security",
        href: siteConfig.links.security,
      },
    ],
  },
  {
    title: "Project",
    links: [
      {
        title: "Roadmap",
        href: siteConfig.links.roadmap,
      },
      {
        title: "Changelog",
        href: siteConfig.links.changelog,
      },
      {
        title: "Code of Conduct",
        href: siteConfig.links.codeOfConduct,
      },
      {
        title: "License",
        href: siteConfig.links.license,
      },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-neutral-950 px-4 pb-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Separator className="bg-white/10" />
        <div className="grid gap-8 pt-8 lg:grid-cols-[1fr_auto] lg:items-start">
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
            className="grid gap-8 text-sm sm:grid-cols-2 lg:min-w-96"
          >
            {footerLinkGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-sm font-medium text-white">{group.title}</h2>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md text-neutral-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-emerald-400/40"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}
