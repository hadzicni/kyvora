import { siteConfig } from "@/config/site"

const GITHUB_API_BASE_URL = "https://api.github.com"
const GITHUB_REVALIDATE_SECONDS = 60 * 60
const FALLBACK_REPOSITORY_URL = "https://github.com/hadzicni/kyvora"

type GitHubRepository = {
  stargazers_count: number
  forks_count: number
  default_branch: string
  pushed_at: string
  updated_at: string
  html_url: string
}

type GitHubSearchResponse = {
  total_count: number
}

type GitHubRelease = {
  tag_name: string
  name: string | null
  html_url: string
  published_at: string | null
}

export type GitHubRepositoryStats = {
  repositoryUrl: string
  owner: string
  repo: string
  stars: number | null
  forks: number | null
  openIssues: number | null
  openPullRequests: number | null
  defaultBranch: string | null
  pushedAt: string | null
  updatedAt: string | null
  latestRelease:
    | {
        name: string
        url: string
        publishedAt: string | null
      }
    | null
  hasRelease: boolean
}

type ParsedRepositoryUrl = {
  owner: string
  repo: string
  repositoryUrl: string
}

function parseGitHubRepositoryUrl(url: string): ParsedRepositoryUrl | null {
  try {
    const repositoryUrl = new URL(url)

    if (repositoryUrl.hostname !== "github.com") {
      return null
    }

    const [owner, repo] = repositoryUrl.pathname
      .replace(/^\/|\/$/g, "")
      .split("/")

    if (!owner || !repo) {
      return null
    }

    return {
      owner,
      repo: repo.replace(/\.git$/, ""),
      repositoryUrl: `https://github.com/${owner}/${repo.replace(/\.git$/, "")}`,
    }
  } catch {
    return null
  }
}

async function fetchGitHubJson<T>(
  endpoint: string,
  options?: { allowNotFound?: boolean }
): Promise<{ data: T | null; notFound: boolean }> {
  try {
    const response = await fetch(`${GITHUB_API_BASE_URL}${endpoint}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: {
        revalidate: GITHUB_REVALIDATE_SECONDS,
      },
    })

    if (response.status === 404 && options?.allowNotFound) {
      return { data: null, notFound: true }
    }

    if (!response.ok) {
      return { data: null, notFound: false }
    }

    return { data: (await response.json()) as T, notFound: false }
  } catch {
    return { data: null, notFound: false }
  }
}

export async function getGitHubRepositoryStats(): Promise<GitHubRepositoryStats | null> {
  const parsedRepository =
    parseGitHubRepositoryUrl(siteConfig.links.github) ??
    parseGitHubRepositoryUrl(FALLBACK_REPOSITORY_URL)

  if (!parsedRepository) {
    return null
  }

  const { owner, repo, repositoryUrl } = parsedRepository
  const encodedRepository = `${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  const searchRepository = `${owner}/${repo}`

  const [repositoryResult, openIssuesResult, openPullRequestsResult, releaseResult] =
    await Promise.all([
      fetchGitHubJson<GitHubRepository>(`/repos/${encodedRepository}`),
      fetchGitHubJson<GitHubSearchResponse>(
        `/search/issues?q=${encodeURIComponent(
          `repo:${searchRepository} type:issue state:open`
        )}`
      ),
      fetchGitHubJson<GitHubSearchResponse>(
        `/search/issues?q=${encodeURIComponent(
          `repo:${searchRepository} type:pr state:open`
        )}`
      ),
      fetchGitHubJson<GitHubRelease>(`/repos/${encodedRepository}/releases/latest`, {
        allowNotFound: true,
      }),
    ])

  if (!repositoryResult.data) {
    return null
  }

  return {
    repositoryUrl: repositoryResult.data.html_url || repositoryUrl,
    owner,
    repo,
    stars: repositoryResult.data.stargazers_count,
    forks: repositoryResult.data.forks_count,
    openIssues: openIssuesResult.data?.total_count ?? null,
    openPullRequests: openPullRequestsResult.data?.total_count ?? null,
    defaultBranch: repositoryResult.data.default_branch,
    pushedAt: repositoryResult.data.pushed_at,
    updatedAt: repositoryResult.data.updated_at,
    latestRelease: releaseResult.data
      ? {
          name: releaseResult.data.name || releaseResult.data.tag_name,
          url: releaseResult.data.html_url,
          publishedAt: releaseResult.data.published_at,
        }
      : null,
    hasRelease: Boolean(releaseResult.data) || !releaseResult.notFound,
  }
}
