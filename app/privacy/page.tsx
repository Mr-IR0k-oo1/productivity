import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, type LegalSection } from "@/components/legal/LegalPage";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${legal.company} collects, uses and protects personal data in ${legal.product}.`,
};

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {legal.product} is a product of {legal.legalEntity} (&ldquo;{legal.company}&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;),{" "}
          {legal.address}. We are the controller of the account data described below.
        </p>
        <p>
          For the content your team puts into a workspace, your organisation decides what goes in and why, and we process it
          on your organisation&apos;s behalf. Questions about that content are best sent to your workspace owner first.
        </p>
        <p>
          Contact us about privacy at <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address and password. Passwords are stored only as a salted hash,
            never in readable form.
          </li>
          <li>
            <strong>Sign-in with another service:</strong> if you sign in with GitHub, Google, Microsoft, Apple or GitLab, we
            receive your name, email address and profile picture from that service, and an identifier that links the two
            accounts. We never receive your password for that service.
          </li>
          <li>
            <strong>Workspace content:</strong> issues, comments, ideas, votes, sprints, flowcharts, calendar events, time
            entries, files you upload, and your role in each workspace.
          </li>
          <li>
            <strong>Session and security data:</strong> for each signed-in session, the IP address and browser details
            (user agent) it started from, so you and we can spot sign-ins that don&apos;t look right.
          </li>
          <li>
            <strong>Preferences:</strong> settings such as theme and notification choices.
          </li>
        </ul>
        <p>
          We don&apos;t use advertising or analytics trackers, and we don&apos;t buy data about you from anyone else.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <ul>
        <li>To run {legal.product}: sign you in, show your workspaces and save your work. (Basis: performing our contract with you.)</li>
        <li>To keep accounts secure, investigate abuse and fix problems. (Basis: our legitimate interest in a safe, working service.)</li>
        <li>To answer you when you contact us. (Basis: our legitimate interest, or your request.)</li>
        <li>To meet legal obligations, such as tax records or lawful requests from authorities. (Basis: legal obligation.)</li>
      </ul>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We don&apos;t sell personal data or share it for advertising. We share it only with:</p>
        <ul>
          <li>People in your workspace, who can see what you post there, according to their role.</li>
          <li>Our hosting provider, {legal.hostingProvider}, which stores and runs the service for us under a data processing agreement.</li>
          <li>The sign-in service you choose (GitHub, Google, Microsoft, Apple or GitLab), only to complete that sign-in.</li>
          <li>Authorities, where the law requires it. We push back on requests that are overly broad.</li>
          <li>A buyer or successor, if {legal.company} is merged or sold. We&apos;ll tell you before your data moves under a different policy.</li>
        </ul>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account details: while your account exists, then deleted within 30 days of closing it.</li>
        <li>Workspace content: until it is deleted from the workspace, or the workspace is deleted.</li>
        <li>Session records: until the session ends or expires.</li>
        <li>Backups: overwritten on a rolling basis, at most 35 days after deletion.</li>
        <li>Records we must keep by law, such as invoices: for the period the law requires.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <p>
        Sessions use httpOnly cookies that page scripts can&apos;t read. Passwords are hashed. What each person can see and change is
        checked on the server for every request, based on their workspace role. No system is perfectly secure; if a breach
        affects your personal data, we will tell you and the relevant authorities as the law requires.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Depending on where you live, you can ask to see, correct, export or delete your personal data, object to or restrict how
          we use it, and withdraw consent you have given. You can change your name and password yourself in your profile.
        </p>
        <p>
          For anything else, email <a href={`mailto:${legal.privacyEmail}`}>{legal.privacyEmail}</a>. We answer within 30 days.
          You can also complain to your local data protection authority.
        </p>
      </>
    ),
  },
  {
    id: "international",
    title: "International transfers",
    body: (
      <p>
        Your data is stored with {legal.hostingProvider}. If it is moved to a country with weaker data protection law than yours,
        we use safeguards the law recognises, such as standard contractual clauses.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: <p>{legal.product} is a work tool and isn&apos;t meant for anyone under 16. We don&apos;t knowingly collect data from children.</p>,
  },
  {
    id: "cookies",
    title: "Cookies",
    body: (
      <p>
        We use only the cookies and browser storage needed to sign you in and remember your settings. The{" "}
        <Link href="/cookies">Cookie Policy</Link> lists each one.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy in a way that matters, we&apos;ll tell you in the product before the change takes
        effect. The date at the top shows when it last changed.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy Policy"
      summary={`What personal data ${legal.product} collects, why, who sees it, and how to get it changed or deleted.`}
      sections={sections}
    />
  );
}
