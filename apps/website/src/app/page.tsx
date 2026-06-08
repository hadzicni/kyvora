import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ArchitectureSection } from "@/components/marketing/architecture-section"
import { CtaSection } from "@/components/marketing/cta-section"
import { FeatureSection } from "@/components/marketing/feature-section"
import { GitHubStatsSection } from "@/components/marketing/github-stats-section"
import { HeroSection } from "@/components/marketing/hero-section"
import { OpenSourceSection } from "@/components/marketing/open-source-section"
import { UseCasesSection } from "@/components/marketing/use-cases-section"

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <SiteHeader />
      <main>
        <HeroSection />
        <FeatureSection />
        <GitHubStatsSection />
        <OpenSourceSection />
        <UseCasesSection />
        <ArchitectureSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  )
}
