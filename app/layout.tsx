import type { Metadata } from "next";
import { Suspense } from "react";

import AppShell from "@/components/layout/AppShell";

import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = {
  title: "Orbit",
  description: "Modern productivity stack for startup teams",
};

const themeBootstrapScript = `
(function() {
  try {
    var storage = localStorage.getItem('orbit-ui');
    var theme = 'dark';

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
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-zinc-800" />
        <div className="h-64 w-48 rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
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