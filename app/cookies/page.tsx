import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal, storageInventory } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: `The cookies and browser storage ${legal.product} uses, and why.`,
};

const sections: LegalSection[] = [
  {
    id: "short-version",
    title: "The short version",
    body: (
      <p>
        {legal.product} uses only what it needs to sign you in and remember your settings. There are no advertising, analytics or
        tracking cookies, and nothing is shared with ad networks. Because everything listed here is strictly necessary for the
        service you asked for, we don&apos;t show a consent banner.
      </p>
    ),
  },
  {
    id: "what-we-use",
    title: "What we use",
    body: (
      <div className="overflow-x-auto rounded-lg border border-[var(--color-border-secondary)]">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">Cookies and browser storage used by {legal.product}</caption>
          <thead className="bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Name</th>
              <th scope="col" className="px-4 py-3 font-semibold">Type</th>
              <th scope="col" className="px-4 py-3 font-semibold">What it&apos;s for</th>
              <th scope="col" className="px-4 py-3 font-semibold">How long</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-secondary)]">
            {storageInventory.map((item) => (
              <tr key={item.name} className="align-top">
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-primary)]">{item.name}</td>
                <td className="px-4 py-3 whitespace-nowrap">{item.kind}</td>
                <td className="px-4 py-3">{item.purpose}</td>
                <td className="px-4 py-3">{item.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "third-party",
    title: "Third-party sign-in",
    body: (
      <p>
        If you choose to sign in with GitHub, Google, Microsoft, Apple or GitLab, you are sent to that service, which sets its own
        cookies under its own policy. {legal.product} doesn&apos;t load any of their scripts on its pages.
      </p>
    ),
  },
  {
    id: "control",
    title: "Your choices",
    body: (
      <p>
        You can block or delete cookies and site data in your browser settings. If you block the session cookie you won&apos;t be
        able to sign in, and clearing local storage resets your theme and last-opened workspace.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: (
      <p>
        If we ever add a cookie that isn&apos;t strictly necessary, we&apos;ll update this page and ask for your consent first. See the{" "}
        <Link href="/privacy">Privacy Policy</Link> for how we handle personal data generally.
      </p>
    ),
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      path="/cookies"
      title="Cookie Policy"
      summary={`Every cookie and piece of browser storage ${legal.product} uses, what it does, and how long it lasts.`}
      sections={sections}
    />
  );
}
