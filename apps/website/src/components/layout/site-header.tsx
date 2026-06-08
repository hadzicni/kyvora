import { ArrowRight, GitBranch } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg outline-none transition-opacity hover:opacity-85 focus-visible:ring-3 focus-visible:ring-emerald-400/40"
          aria-label="Kyvora home"
        >
          <span className="flex size-8 items-center justify-center">
            <Image
              src="/icon.svg"
              alt=""
              width={32}
              height={32}
              priority
              aria-hidden="true"
              className="size-8"
            />
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
                  item.href.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
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
            <Link href={siteConfig.links.docs}>
              Get Started
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
