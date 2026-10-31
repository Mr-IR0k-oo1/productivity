"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, Sparkles, X } from "lucide-react";

import { BrandLogo, OrbitGlyph } from "@/components/brand/BrandLogo";
import { getAppUrl } from "@/lib/config/domains";

const navLinks = [
  { href: "#modules", label: "Product" },
  { href: "#workspace", label: "Workspace" },
  { href: "#focus", label: "Focus Mode" },
  { href: "#planning", label: "Planning" },
  { href: "#analytics", label: "Analytics" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-5xl transition-all">
        <div className="flex items-center justify-between rounded-full border border-white/10 bg-[#09090b]/80 px-5 py-2.5 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.12)]">
          {/* Brand */}
          <Link href="/" aria-label="ORBIT home" className="flex items-center gap-2 group">
            <OrbitGlyph
              className="h-5 w-5 text-[#8b5cf6] transition-transform group-hover:scale-110"
              satelliteClassName="fill-[#ff8a3d]"
            />
            <span className="font-display text-sm font-bold tracking-tight text-white">
              ORBIT
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav aria-label="Main Navigation" className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium text-[#a1a1aa] transition-all hover:bg-white/[0.08] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden items-center gap-2.5 md:flex">
            <Link
              href={getAppUrl("/login")}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#a1a1aa] transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href={getAppUrl("/register")}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#6d28d9] px-4 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(139,92,246,0.45)] transition-all hover:shadow-[0_0_28px_rgba(139,92,246,0.7)] hover:scale-105 active:scale-95"
            >
              <span>Get started</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#a1a1aa] hover:bg-white/10 hover:text-white md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-4 top-20 z-50 rounded-3xl border border-white/15 bg-[#09090b]/95 p-6 backdrop-blur-3xl shadow-2xl md:hidden animate-scale-in">
          <nav className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#a1a1aa] transition-colors hover:bg-white/[0.08] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2.5 border-t border-white/10 pt-4">
              <Link
                href={getAppUrl("/login")}
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-white"
              >
                Sign in
              </Link>
              <Link
                href={getAppUrl("/register")}
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-sm font-semibold text-white shadow-lg"
              >
                <span>Get started free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
