import Link from "next/link";
import type React from "react";

import { BrandLogo, QuantrixCredit } from "@/components/brand/BrandLogo";
import { legal } from "@/lib/legal";
import { getAppUrl } from "@/lib/config/domains";

const navLinks = [
  { href: "/features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader({ tone = "default" }: { tone?: "default" | "space" }) {
  const onSpace = tone === "space";
  return (
    <header className={onSpace ? "space-panel relative z-10 bg-transparent" : "border-b border-[var(--color-border-secondary)]"}>
      <div className="mx-auto flex max-w-6xl items-center gap-8 px-4 py-5 sm:px-8">
        <Link href="/" aria-label="Orbit home" className="rounded-md text-[var(--color-text-primary)]">
          <BrandLogo />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 gap-7 text-sm text-[var(--color-text-secondary)] md:flex">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-[var(--color-text-primary)]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href={getAppUrl("/login")} className="rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            Sign in
          </Link>
          <Link
            href={getAppUrl("/register")}
            className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)]"
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  );
}

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "/features", label: "All features" },
      { href: "/features/sprints", label: "Backlog and sprints" },
      { href: "/features/board", label: "Board and views" },
      { href: "/features/ideas", label: "Ideas" },
      { href: "/features/flowcharts", label: "Flowcharts" },
      { href: "/features/reports", label: "Reports and time" },
      { href: "/security", label: "Security" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: getAppUrl("/register"), label: "Create a workspace" },
      { href: getAppUrl("/login"), label: "Sign in" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
];

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="space-panel border-t border-[var(--color-border-secondary)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-8 lg:grid-cols-[1.3fr_2fr]">
        <div>
          <BrandLogo className="text-[var(--color-text-primary)]" />
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Sprints, backlog, board, ideas and flowcharts for product teams.
          </p>
          <a href={legal.website} className="mt-6 inline-flex text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
            <QuantrixCredit className="text-xs" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{column.title}</h2>
              <ul className="mt-4 space-y-2.5 text-sm">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[var(--color-border-secondary)]">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-[var(--color-text-tertiary)] sm:px-8">
          © {year} {legal.legalEntity}. Orbit is a product of {legal.company}.
        </p>
      </div>
    </footer>
  );
}

/* ───────────────────────── Closing call to action ───────────────────────── */

export function ClosingCta() {
  return (
    <section className="px-4 py-24 sm:px-8">
      <div className="space-panel orbit-hero mx-auto flex max-w-6xl flex-col items-start gap-8 px-8 py-14 sm:px-14 lg:flex-row lg:items-center">
        <div className="flex-1">
          <h2 className="max-w-[20ch] font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.04em] text-[var(--color-text-primary)]">
            Put your next sprint in orbit.
          </h2>
          <p className="mt-4 max-w-[48ch] text-[var(--color-text-secondary)]">
            Create a workspace, invite your team, and start planning in a few minutes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={getAppUrl("/register")}
            className="rounded-md bg-[var(--color-accent)] px-6 py-3 text-sm font-semibold text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)]"
          >
            Create your workspace
          </Link>
          <Link
            href={getAppUrl("/login")}
            className="rounded-md border border-[var(--color-border-tertiary)] px-6 py-3 text-sm font-semibold text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Deep-space page header for marketing pages below the home page. */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow?: string; title: string; intro: string; children?: React.ReactNode }) {
  return (
    <section className="space-panel orbit-hero rounded-none border-x-0 border-t-0">
      <SiteHeader tone="space" />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-12 sm:px-8 lg:pb-24 lg:pt-16">
        {eyebrow ? <p className="text-sm font-medium text-[var(--color-flare)]">{eyebrow}</p> : null}
        <h1 className="mt-4 max-w-[20ch] font-display text-[clamp(2.25rem,5vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.05em] text-[var(--color-text-primary)]">
          {title}
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-[var(--color-text-secondary)]">{intro}</p>
        {children}
      </div>
    </section>
  );
}
