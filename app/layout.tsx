import type { Metadata } from "next";

import AppShell from "@/components/layout/AppShell";

import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = {
  title: "PulseForge",
  description: "Modern productivity stack for startup teams",
};

const themeBootstrapScript = `
(function() {
  try {
    var storage = localStorage.getItem('pulseforge-ui');
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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" data-theme="dark" suppressHydrationWarning>
      <body className="bg-[var(--background)] text-[var(--foreground)] antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
