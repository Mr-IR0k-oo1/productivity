import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The agreement between you and ${legal.company} for using ${legal.product}.`,
};

const sections: LegalSection[] = [
  {
    id: "agreement",
    title: "The agreement",
    body: (
      <>
        <p>
          These terms are an agreement between you and {legal.legalEntity} (&ldquo;{legal.company}&rdquo;, &ldquo;we&rdquo;) for using{" "}
          {legal.product}. By creating an account or using {legal.product}, you agree to them. If you use {legal.product} for an
          organisation, you confirm you can accept these terms for it, and &ldquo;you&rdquo; includes that organisation.
        </p>
        <p>
          The <Link href="/privacy">Privacy Policy</Link> explains how we handle personal data and is part of these terms.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and workspaces",
    body: (
      <ul>
        <li>You must be at least 16 and give accurate details when you sign up.</li>
        <li>Keep your sign-in details safe. You are responsible for what happens under your account.</li>
        <li>
          A workspace&apos;s owner controls who can join and what each person can do. Owners and admins can remove people and
          content from their workspace.
        </li>
        <li>Tell us straight away if you think someone has got into your account.</li>
      </ul>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <>
        <p>
          You keep ownership of everything you and your team put into {legal.product}. You give us permission to store, copy and
          display that content only as needed to run the service for you, including backups.
        </p>
        <p>You confirm you have the right to upload what you upload, and that it doesn&apos;t break the law or anyone&apos;s rights.</p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>Don&apos;t use {legal.product} to:</p>
        <ul>
          <li>break the law, or store or share content that is illegal, infringing, abusive or malicious;</li>
          <li>try to get into accounts, workspaces or systems you aren&apos;t allowed to access;</li>
          <li>disrupt the service, overload it, or get around its limits or security;</li>
          <li>copy, resell or rebuild {legal.product} without our written permission.</li>
        </ul>
        <p>We may suspend accounts that do, and will tell you why unless the law or safety prevents it.</p>
      </>
    ),
  },
  {
    id: "plans-payment",
    title: "Plans and payment",
    body: (
      <p>
        If you use a paid plan, the price, billing period and what is included are shown when you subscribe. Fees are charged in
        advance and, except where the law says otherwise, aren&apos;t refundable for the current period. We&apos;ll give you at least
        30 days&apos; notice before a price change affects you, and you can cancel before it does.
      </p>
    ),
  },
  {
    id: "our-service",
    title: "Our service",
    body: (
      <p>
        We work to keep {legal.product} available and your data safe, and we improve it over time. That means features may change.
        If we remove something important you rely on, we&apos;ll give you reasonable notice. We don&apos;t promise the service will
        never be interrupted.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Ending the agreement",
    body: (
      <p>
        You can stop using {legal.product} and delete your account at any time. We can end or suspend your access if you seriously
        or repeatedly break these terms, or if we stop offering {legal.product}; in that case we&apos;ll give you at least 30
        days to export your data, unless the law or a security risk prevents it.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Warranties and liability",
    body: (
      <>
        <p>
          {legal.product} is provided &ldquo;as is&rdquo;. To the extent the law allows, we disclaim implied warranties such as fitness
          for a particular purpose.
        </p>
        <p>
          To the extent the law allows, we aren&apos;t liable for indirect or consequential losses, such as lost profits or data, and
          our total liability is limited to what you paid us in the 12 months before the claim. Nothing in these terms limits
          liability that can&apos;t be limited by law.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. If a change matters, we&apos;ll tell you in the product at least 30 days before it takes effect.
        If you keep using {legal.product} after that, the new terms apply.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and contact",
    body: (
      <p>
        These terms are governed by the laws of {legal.governingLaw}, and disputes go to {legal.venue}. Contact us at{" "}
        <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a> or {legal.address}.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms of Service"
      summary={`The rules for using ${legal.product}: what you can expect from us, and what we expect from you.`}
      sections={sections}
    />
  );
}
