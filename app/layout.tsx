import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { Suspense } from "react";

import AppShell from "@/components/layout/AppShell";

import "./globals.css";
import { Providers } from "./providers";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Orbit — issue tracking you host yourself", template: "%s · Orbit" },
  description: "Sprints, backlogs, boards, ideas and flowcharts for startups and growing companies. Self-hosted, with single sign-on and roles.",
};

const themeBootstrapScript = `
(function() {
  try {
    var storage = localStorage.getItem('orbit-ui');
    // No saved choice: follow the operating system.
    var theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    if (storage) {
      var parsed = JSON.parse(storage);
      var storedTheme = parsed && parsed.state && parsed.state.theme;

      if (storedTheme === 'light' || storedTheme === 'dark') {
        theme = storedTheme;
      }
    }

    var root = document.documentElement;
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
  } catch (error) {}
})();
`;

function LoadingShell() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a7 7 0 0 1 0 14" />
          </svg>
        </div>
        <div className="h-1 w-24 overflow-hidden rounded-full bg-[var(--color-border-secondary)]">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--accent)]" />
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`} data-theme="light" suppressHydrationWarning>
      <body className="bg-[var(--background)] font-sans text-[var(--foreground)] antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <Providers>
          <Suspense fallback={<LoadingShell />}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}