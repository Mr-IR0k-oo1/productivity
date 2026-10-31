import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, KeyRound, Link2, ShieldCheck, Users } from "lucide-react";

import { RolesTable } from "@/components/landing/RolesTable";
import { ClosingCta, PageHero, SiteFooter } from "@/components/landing/SiteChrome";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Security",
  description: "How Orbit protects accounts and workspace data: server-enforced roles, httpOnly sessions, hashed passwords and workspace isolation.",
};

const practices = [
  {
    icon: ShieldCheck,
    title: "Roles checked on the server",
    body: "Every request is checked against the person's role in that workspace before anything is read or changed. Hiding a button is never the only protection.",
  },
  {
    icon: Users,
    title: "Workspaces kept apart",
    body: "Every query is scoped to the workspace it belongs to, so an ID from one workspace can't be used to reach data in another.",
  },
  {
    icon: KeyRound,
    title: "API keys never stored readable",
    body: "API keys are shown once and stored only as SHA-256 hashes. Read-only keys can't change anything, and any key can be revoked.",
  },
  {
    icon: Link2,
    title: "Public links only when you choose",
    body: "Flowcharts are private to the workspace. A read-only public link exists only when someone turns it on, and it can be turned off again.",
  },
  {
    icon: Cookie,
    title: "No trackers",
    body: "No advertising or analytics scripts run in Orbit. Orbit sets no cookies.",
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <PageHero
        eyebrow="Security"
        title="Your roadmap stays with your team."
        intro="Orbit holds your plans, bugs and ideas. Here is how access is decided and how accounts and data are protected."
      />

      <main>
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8 lg:py-28" aria-labelledby="practices-heading">
          <h2 id="practices-heading" className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.04em]">
            How Orbit protects your work
          </h2>
          <dl className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {practices.map(({ icon: Icon, title, body }) => (
              <div key={title}>
                <dt className="flex items-center gap-2.5 font-semibold">
                  <Icon className="h-5 w-5 text-[var(--color-accent)]" aria-hidden="true" />
                  {title}
                </dt>
                <dd className="mt-2 leading-relaxed text-[var(--color-text-secondary)]">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="border-y border-[var(--color-border-secondary)] bg-[var(--color-surface)]" aria-labelledby="roles-heading">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 id="roles-heading" className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold tracking-[-0.04em]">
                Four roles, no guesswork
              </h2>
              <p className="mt-5 max-w-[44ch] leading-relaxed text-[var(--color-text-secondary)]">
                Owners and admins decide who joins and what they can do. Members create and edit work and can delete what they
                created. Viewers can read everything and change nothing.
              </p>
            </div>
            <RolesTable />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-8" aria-labelledby="privacy-heading">
          <div className="grid gap-10 md:grid-cols-2">
            <div>
              <h2 id="privacy-heading" className="text-xl font-semibold">
                Privacy and data
              </h2>
              <p className="mt-3 leading-relaxed text-[var(--color-text-secondary)]">
                What we collect, why, and how to get it exported or deleted is in the{" "}
                <Link href="/privacy" className="text-[var(--color-accent)] underline underline-offset-4">
                  Privacy Policy
                </Link>
                . Every cookie is listed in the{" "}
                <Link href="/cookies" className="text-[var(--color-accent)] underline underline-offset-4">
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Found a vulnerability?</h2>
              <p className="mt-3 leading-relaxed text-[var(--color-text-secondary)]">
                Please tell us privately at{" "}
                <a href={`mailto:${legal.contactEmail}`} className="text-[var(--color-accent)] underline underline-offset-4">
                  {legal.contactEmail}
                </a>{" "}
                before sharing it anywhere else. We&apos;ll confirm we received it and keep you updated while we fix it.
              </p>
            </div>
          </div>
        </section>
      </main>

      <ClosingCta />
      <SiteFooter />
    </div>
  );
}
