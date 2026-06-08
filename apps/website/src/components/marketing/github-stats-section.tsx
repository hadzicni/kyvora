import Link from "next/link"
import { ArrowUpRight, GitFork, GitPullRequest, Star, Tag, CircleDot } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getGitHubRepositoryStats } from "@/lib/github"

const numberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
})

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
})

function formatNumber(value: number | null) {
  if (value === null) {
    return "—"
  }

  return numberFormatter.format(value)
}

function formatDate(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return dateFormatter.format(date)
}

export async function GitHubStatsSection() {
  const stats = await getGitHubRepositoryStats()

  if (!stats) {
    return (
      <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="github-stats-title">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <Badge
              variant="outline"
              className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
            >
              GitHub
            </Badge>
            <h2
              id="github-stats-title"
              className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl"
            >
              Open-source by design.
            </h2>
            <p className="mt-4 text-base leading-7 text-neutral-400">
              Follow Kyvora’s development on GitHub, inspect the code, open
              issues, and track releases as the project evolves.
            </p>
          </div>

          <Card className="mt-10 rounded-lg border-white/10 bg-white/[0.03]">
            <CardHeader>
              <CardTitle className="text-white">
                GitHub stats are temporarily unavailable.
              </CardTitle>
              <CardDescription className="leading-6 text-neutral-400">
                The repository remains available on GitHub, but live metrics
                could not be loaded right now.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    )
  }

  const releaseDate = formatDate(stats.latestRelease?.publishedAt ?? null)
  const cards = [
    {
      label: "Stars",
      value: formatNumber(stats.stars),
      description: "People following or bookmarking the repository.",
      href: `${stats.repositoryUrl}/stargazers`,
      icon: Star,
    },
    {
      label: "Forks",
      value: formatNumber(stats.forks),
      description: "Community copies for experiments and contributions.",
      href: `${stats.repositoryUrl}/forks`,
      icon: GitFork,
    },
    {
      label: "Open issues",
      value: formatNumber(stats.openIssues),
      description: "Tracked bugs, ideas, and implementation work.",
      href: `${stats.repositoryUrl}/issues`,
      icon: CircleDot,
    },
    {
      label: "Open pull requests",
      value: formatNumber(stats.openPullRequests),
      description: "Proposed changes currently under review.",
      href: `${stats.repositoryUrl}/pulls`,
      icon: GitPullRequest,
    },
    {
      label: "Latest release",
      value: stats.latestRelease?.name ?? (stats.hasRelease ? "—" : "No release yet"),
      description: releaseDate ? `Published ${releaseDate}.` : "Versioned release status.",
      href: stats.latestRelease?.url ?? `${stats.repositoryUrl}/releases`,
      icon: Tag,
    },
  ]

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8" aria-labelledby="github-stats-title">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <Badge
              variant="outline"
              className="border-emerald-300/25 bg-emerald-300/10 text-emerald-200"
            >
              GitHub
            </Badge>
            <h2
              id="github-stats-title"
              className="mt-4 text-3xl font-semibold tracking-normal text-white sm:text-4xl"
            >
              Open-source by design.
            </h2>
          </div>
          <div>
            <p className="text-base leading-7 text-neutral-400">
              Follow Kyvora’s development on GitHub, inspect the code, open
              issues, and track releases as the project evolves.
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mt-5 border-white/15 bg-white/[0.03] text-neutral-100 hover:bg-white/10"
            >
              <Link href={stats.repositoryUrl} target="_blank" rel="noopener noreferrer">
                View repository
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {cards.map((card) => (
            <Card
              key={card.label}
              className="rounded-lg border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.025] transition-colors hover:border-emerald-300/35"
            >
              <CardHeader>
                <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-neutral-900 text-emerald-200">
                  <card.icon className="size-5" aria-hidden="true" />
                </div>
                <CardDescription className="text-sm text-neutral-500">
                  {card.label}
                </CardDescription>
                <CardTitle className="text-3xl text-white">{card.value}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-5">
                <CardDescription className="leading-6 text-neutral-400">
                  {card.description}
                </CardDescription>
                <Link
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1 rounded-md text-sm font-medium text-emerald-200 outline-none transition-colors hover:text-emerald-100 focus-visible:ring-3 focus-visible:ring-emerald-400/40"
                  aria-label={`View ${card.label.toLowerCase()} on GitHub`}
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
