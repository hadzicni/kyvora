const githubUrl = "https://github.com/hadzicni/kyvora"
const githubFileUrl = (path: string) => `${githubUrl}/blob/main/${path}`

export const siteConfig = {
  name: "Kyvora",
  url: "https://kyvora.dev",
  description:
    "Kyvora is an open-source homelab control plane for managing servers, agents, monitoring, users, and infrastructure operations.",
  links: {
    github: githubUrl,
    docs: `${githubUrl}/tree/main/docs`,
    roadmap: `${githubUrl}/issues`,
    changelog: `${githubUrl}/releases`,
    contributing: githubFileUrl("CONTRIBUTING.md"),
    codeOfConduct: githubFileUrl("CODE_OF_CONDUCT.md"),
    security: githubFileUrl("SECURITY.md"),
    license: githubFileUrl("LICENSE"),
  },
  mainNav: [
    {
      title: "Features",
      href: "#features",
    },
    {
      title: "Architecture",
      href: "#architecture",
    },
    {
      title: "Roadmap",
      href: `${githubUrl}/issues`,
    },
    {
      title: "GitHub",
      href: githubUrl,
    },
  ],
} as const
