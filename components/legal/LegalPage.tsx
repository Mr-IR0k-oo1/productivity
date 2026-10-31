import Link from "next/link";
import type { ReactNode } from "react";

import { SiteFooter, SiteHeader } from "@/components/landing/SiteChrome";
import { legal } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: ReactNode };

const otherDocs = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/cookies", label: "Cookie Policy" },
];

export function LegalPage({
  title,
  summary,
  path,
  sections,
}: {
  title: string;
  summary: string;
  path: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-8 lg:pt-16">
        {!legal.reviewed ? (
          <div
            role="note"
            className="mb-10 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 px-4 py-3 text-sm text-[var(--color-text-primary)]"
          >
            <strong className="font-semibold">Draft.</strong> This document has not been reviewed by a lawyer yet, and
            some company details are still placeholders. It isn&apos;t in force until this notice is removed.
          </div>
        ) : null}

        <div className="grid gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <nav aria-label="Legal documents" className="space-y-1 text-sm">
              {otherDocs.map((doc) => (
                <Link
                  key={doc.href}
                  href={doc.href}
                  aria-current={doc.href === path ? "page" : undefined}
                  className={
                    doc.href === path
                      ? "block rounded-md bg-[var(--color-accent-soft)] px-3 py-2 font-medium text-[var(--color-text-primary)]"
                      : "block rounded-md px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  }
                >
                  {doc.label}
                </Link>
              ))}
            </nav>
            <nav aria-label="On this page" className="mt-8 hidden text-sm lg:block">
              <p className="px-3 text-xs font-medium text-[var(--color-text-tertiary)]">On this page</p>
              <ol className="mt-2 space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-md px-3 py-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="max-w-[68ch]">
            <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.04em]">{title}</h1>
            <p className="mt-3 text-sm text-[var(--color-text-tertiary)]">Effective {legal.effectiveDate}</p>
            <p className="mt-6 text-lg leading-relaxed text-[var(--color-text-secondary)]">{summary}</p>

            <div className="mt-12 space-y-12">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-8">
                  <h2 className="text-xl font-semibold tracking-[-0.01em]">
                    <span className="mr-2 tabular-nums text-[var(--color-text-tertiary)]">{index + 1}.</span>
                    {section.title}
                  </h2>
                  <div className="legal-prose mt-4">{section.body}</div>
                </section>
              ))}
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
