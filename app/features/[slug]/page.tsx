import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { FeatureVignette } from "@/components/landing/FeatureVignette";
import { ClosingCta, PageHero, SiteFooter } from "@/components/landing/SiteChrome";
import { featurePages, getFeaturePage, relatedFeaturePages } from "@/lib/marketing/features";

type Params = Promise<{ slug: string }>;

export function generateStaticParams() {
  return featurePages.map((page) => ({ slug: page.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const page = getFeaturePage((await params).slug);
  if (!page) return {};
  return { title: page.name, description: page.intro };
}

export default async function FeaturePage({ params }: { params: Params }) {
  const page = getFeaturePage((await params).slug);
  if (!page) notFound();

  const related = relatedFeaturePages(page);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <PageHero eyebrow={page.name} title={page.headline} intro={page.intro}>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)]"
          >
            Open your workspace
          </Link>
          <Link
            href="/features"
            className="rounded-md border border-[var(--color-border-tertiary)] px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            All features
          </Link>
        </div>
      </PageHero>

      <main>
        <section className="mx-auto -mt-12 max-w-4xl px-4 sm:px-8">
          <div className="relative rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-popover)]">
            <FeatureVignette name={page.vignette} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 lg:py-28" aria-labelledby="highlights-heading">
          <h2 id="highlights-heading" className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.04em]">
            What you get
          </h2>
          <dl className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-border-secondary)] sm:grid-cols-2 lg:grid-cols-3">
            {page.highlights.map((item) => (
              <div key={item.title} className="bg-[var(--color-surface)] p-7">
                <dt className="font-semibold">{item.title}</dt>
                <dd className="mt-2 leading-relaxed text-[var(--color-text-secondary)]">{item.body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {related.length > 0 ? (
          <section className="border-t border-[var(--color-border-secondary)] bg-[var(--color-surface)]" aria-labelledby="related-heading">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
              <h2 id="related-heading" className="text-lg font-semibold">
                Works well with
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/features/${item.slug}`}
                      className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--color-border-secondary)] p-5 transition-colors hover:border-[var(--color-accent)]"
                    >
                      <span>
                        <span className="block font-semibold">{item.name}</span>
                        <span className="mt-1 block text-sm text-[var(--color-text-secondary)]">{item.tagline}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-accent)] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>

      <ClosingCta />
      <SiteFooter />
    </div>
  );
}
