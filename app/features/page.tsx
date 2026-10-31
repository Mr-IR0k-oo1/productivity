import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeatureVignette } from "@/components/landing/FeatureVignette";
import { ClosingCta, PageHero, SiteFooter } from "@/components/landing/SiteChrome";
import { featurePages } from "@/lib/marketing/features";

export const metadata: Metadata = {
  title: "Features",
  description: "Backlog and sprints, board and views, ideas, flowcharts, reports and time tracking in Orbit.",
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <PageHero
        eyebrow="Features"
        title="Everything your team plans with, in one place."
        intro="Orbit covers the whole cycle: collecting ideas, planning sprints, moving work across the board, drawing the flows, and reading what happened."
      />

      <main className="mx-auto max-w-6xl px-4 py-20 sm:px-8 lg:py-28">
        <ul className="grid gap-6 md:grid-cols-2">
          {featurePages.map((page) => (
            <li key={page.slug}>
              <Link
                href={`/features/${page.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 transition-colors hover:border-[var(--color-accent)]"
              >
                <div className="pointer-events-none">
                  <FeatureVignette name={page.vignette} />
                </div>
                <h2 className="mt-6 font-display text-xl font-semibold tracking-[-0.03em]">{page.name}</h2>
                <p className="mt-2 flex-1 text-[var(--color-text-secondary)]">{page.tagline}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-accent)]">
                  Learn more about {page.name.toLowerCase()}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>

      <ClosingCta />
      <SiteFooter />
    </div>
  );
}
