import type { Metadata } from "next";

import Sidebar from "@/components/layout/Sidebar";

import "./globals.css";
import { Providers } from "./providers";
export const metadata: Metadata = {
  title: "PulseForge",
  description: "Modern productivity stack for startup teams",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0a] text-white antialiased">
        <Providers>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto p-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
