"use client";

import Link from "next/link";
import { ArrowRight, Menu, Sparkles, X } from "lucide-react";
import React from "react";

import { cn } from "@/lib/utils";

/*
  SaaS landing hero: fixed glass navigation, announcement pill, gradient headline, dual CTAs,
  and a high-fidelity product preview with multi-layer ambient cosmic glow.
*/

// ── Button ──────────────────────────────────────────────────────────────

type ButtonVariant = "default" | "secondary" | "ghost" | "gradient";
type ButtonSize = "default" | "sm" | "lg";

const baseStyles =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<ButtonVariant, string> = {
  default: "bg-white text-black hover:bg-neutral-100 shadow-[0_2px_12px_rgba(255,255,255,0.2)] active:scale-95",
  secondary: "border border-white/15 bg-white/[0.06] text-white hover:bg-white/[0.12] hover:border-white/30 backdrop-blur-md active:scale-95",
  ghost: "text-white/80 hover:bg-white/[0.08] hover:text-white",
  gradient: "bg-gradient-to-r from-[#9d90ff] via-[#8b7cff] to-[#ff8a3d] text-[#0b0820] font-bold shadow-[0_0_36px_rgba(157,144,255,0.6)] hover:shadow-[0_0_50px_rgba(157,144,255,0.85)] hover:scale-105 active:scale-95",
};

const sizes: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-9 px-4 text-xs",
  lg: "h-12 px-8 text-base",
};

export function buttonClasses(variant: ButtonVariant = "default", size: ButtonSize = "default", className?: string) {
  return cn(baseStyles, variants[variant], sizes[size], className);
}

/** A link styled as the template's button. */
function ButtonLink({
  href,
  variant,
  size,
  className,
  children,
  onClick,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link href={href} onClick={onClick} className={buttonClasses(variant, size, className)}>
      {children}
    </Link>
  );
}

// ── Types ───────────────────────────────────────────────────────────────

export type NavLink = { href: string; label: string };
export type Action = { href: string; label: string };

export type SaasTemplateProps = {
  /** Brand mark or wordmark shown at the left of the navigation. */
  logo: React.ReactNode;
  /** Accessible name for the logo link. */
  logoLabel?: string;
  links: NavLink[];
  signIn: Action;
  signUp: Action;
  announcement?: { text: string; link: Action };
  title: React.ReactNode;
  description: React.ReactNode;
  primaryAction: Action;
  secondaryAction?: Action;
  /** The product preview under the call to action. */
  preview: React.ReactNode;
};

// ── Navigation ──────────────────────────────────────────────────────────

const Navigation = React.memo(function Navigation({
  logo,
  logoLabel = "Home",
  links,
  signIn,
  signUp,
}: Pick<SaasTemplateProps, "logo" | "logoLabel" | "links" | "signIn" | "signUp">) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const close = () => setMobileMenuOpen(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/[0.08] bg-black/75 backdrop-blur-xl">
      <nav aria-label="Main" className="relative mx-auto max-w-7xl px-6 py-3.5">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label={logoLabel} className="rounded-md text-white transition-opacity hover:opacity-90">
            {logo}
          </Link>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-8 md:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-white/70 transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <ButtonLink href={signIn.href} variant="ghost" size="sm">
              {signIn.label}
            </ButtonLink>
            <ButtonLink href={signUp.href} variant="default" size="sm" className="rounded-lg">
              {signUp.label}
            </ButtonLink>
          </div>

          <button
            type="button"
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div id="mobile-menu" className="animate-[saasSlideDown_0.25s_ease-out] border-t border-white/[0.08] bg-black/95 backdrop-blur-2xl md:hidden">
          <div className="flex flex-col gap-3 px-6 py-5">
            {links.map((link) => (
              <Link key={link.href} href={link.href} onClick={close} className="py-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
                {link.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2.5 border-t border-white/[0.08] pt-4">
              <ButtonLink href={signIn.href} variant="ghost" size="sm" onClick={close}>
                {signIn.label}
              </ButtonLink>
              <ButtonLink href={signUp.href} variant="default" size="sm" onClick={close}>
                {signUp.label}
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
});

// ── Hero ────────────────────────────────────────────────────────────────

const Hero = React.memo(function Hero({
  announcement,
  title,
  description,
  primaryAction,
  secondaryAction,
  preview,
}: Pick<SaasTemplateProps, "announcement" | "title" | "description" | "primaryAction" | "secondaryAction" | "preview">) {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-start overflow-hidden px-6 pb-16 pt-32 md:pt-40">
      {/* Ambient Celestial Glows */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[550px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(139,124,255,0.28),rgba(242,102,43,0.08)_40%,transparent_70%)] blur-3xl"
        aria-hidden="true"
      />

      {announcement ? (
        <aside className="mb-8 inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-4 py-1.5 shadow-[0_0_20px_rgba(139,124,255,0.15)] backdrop-blur-md transition-all hover:border-white/25">
          <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d] shadow-[0_0_8px_#ff8a3d] animate-pulse" />
          <span className="whitespace-nowrap text-center text-xs font-medium text-white/80">{announcement.text}</span>
          <Link
            href={announcement.link.href}
            className="flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#8b7cff] transition-all hover:text-white active:scale-95"
          >
            {announcement.link.label}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </aside>
      ) : null}

      <h1 className="mb-6 max-w-4xl bg-gradient-to-b from-white via-white to-white/60 bg-clip-text px-4 text-center font-display text-[clamp(2.5rem,5.5vw,4.5rem)] font-bold leading-[1.06] tracking-[-0.04em] text-transparent">
        {title}
      </h1>

      <p className="mb-10 max-w-2xl px-6 text-center text-base leading-relaxed text-white/70 md:text-lg">{description}</p>

      <div className="relative z-10 mb-16 flex flex-wrap items-center justify-center gap-3.5">
        <ButtonLink href={primaryAction.href} variant="gradient" size="lg" className="rounded-xl">
          {primaryAction.label}
        </ButtonLink>
        {secondaryAction ? (
          <ButtonLink href={secondaryAction.href} variant="secondary" size="lg" className="rounded-xl">
            {secondaryAction.label}
          </ButtonLink>
        ) : null}
      </div>

      <div className="relative w-full max-w-5xl">
        {/* Glow behind preview */}
        <div
          className="pointer-events-none absolute left-1/2 top-[-10%] z-0 h-[80%] w-[95%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(157,144,255,0.4),rgba(255,138,61,0.15)_45%,transparent_75%)] blur-3xl opacity-80"
          aria-hidden="true"
        />
        <div className="relative z-10">{preview}</div>
      </div>
    </section>
  );
});

// ── Page ────────────────────────────────────────────────────────────────

export default function SaasTemplate(props: SaasTemplateProps) {
  return (
    <div className="min-h-screen bg-[#07090f] text-white">
      <Navigation logo={props.logo} logoLabel={props.logoLabel} links={props.links} signIn={props.signIn} signUp={props.signUp} />
      <Hero
        announcement={props.announcement}
        title={props.title}
        description={props.description}
        primaryAction={props.primaryAction}
        secondaryAction={props.secondaryAction}
        preview={props.preview}
      />
    </div>
  );
}
