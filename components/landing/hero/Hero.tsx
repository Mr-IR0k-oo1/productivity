"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { MotionConfig, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useEffect, useRef, useState, type PointerEvent } from "react";

import { SiteHeader } from "@/components/landing/SiteChrome";
import { getAppUrl } from "@/lib/config/domains";

// WebGL loads after the text has painted, so the headline is never waiting on three.js.
const OrbitScene = dynamic(() => import("@/components/landing/hero/OrbitScene"), { ssr: false });

const HEADLINE = ["Know", "where", "every", "sprint", "stands."];
const EASE = [0.16, 1, 0.3, 1] as const;

const issues = [
  { key: "QTX-41", title: "Checkout fails on Safari 18", status: "In progress", tone: "active" },
  { key: "QTX-38", title: "Invite teammates by email", status: "In review", tone: "active" },
  { key: "QTX-36", title: "Usage export for finance", status: "Done", tone: "done" },
  { key: "QTX-35", title: "Rotate API keys from settings", status: "To do", tone: "todo" },
] as const;

/** Glass sprint card that tilts toward the pointer. */
function SprintCard({ still }: { still: boolean }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), { stiffness: 160, damping: 18 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { stiffness: 160, damping: 18 });

  function onMove(event: PointerEvent<HTMLDivElement>) {
    if (still) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - rect.left) / rect.width - 0.5);
    y.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 18 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1.2, delay: 1.1, ease: EASE }}
      style={{ perspective: 900 }}
      className="relative w-full max-w-[400px]"
    >
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={() => {
          x.set(0);
          y.set(0);
        }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="rounded-2xl border border-white/10 bg-[rgba(16,19,32,0.62)] p-1.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(157,144,255,0.08)] backdrop-blur-xl"
      >
        <div className="flex items-center justify-between px-3.5 pb-2.5 pt-3">
          <div>
            <p className="text-sm font-semibold text-[var(--color-space-text)]">Sprint 14</p>
            <p className="text-xs text-[var(--color-space-muted)]">Ship self-serve billing</p>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-[#ff8a3d]/30 bg-[#ff8a3d]/10 px-2.5 py-1 text-xs font-medium text-[#ffb27f]">
            <span className="relative flex h-1.5 w-1.5">
              {!still ? <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff8a3d] opacity-70" /> : null}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" />
            </span>
            4 days left
          </span>
        </div>
        <div className="mx-3.5 mb-3 h-1 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#8b7cff] to-[#ff8a3d]"
            initial={{ width: "0%" }}
            animate={{ width: "64%" }}
            transition={{ duration: 1.6, delay: 1.6, ease: EASE }}
          />
        </div>
        <ul className="divide-y divide-white/[0.06] rounded-xl bg-black/25">
          {issues.map((issue) => (
            <li key={issue.key} className="flex items-center gap-3 px-3.5 py-2.5 text-sm">
              <span
                className={
                  issue.tone === "done"
                    ? "h-2 w-2 shrink-0 rounded-full bg-[#8b7cff] shadow-[0_0_10px_#8b7cff]"
                    : issue.tone === "active"
                      ? "h-2 w-2 shrink-0 rounded-full border-2 border-[#8b7cff]"
                      : "h-2 w-2 shrink-0 rounded-full bg-[#4a5070]"
                }
                aria-hidden="true"
              />
              <span className="w-12 shrink-0 font-mono text-[11px] text-[var(--color-space-muted)]">{issue.key}</span>
              <span
                className={
                  issue.tone === "done"
                    ? "min-w-0 flex-1 truncate text-[var(--color-space-muted)] line-through"
                    : "min-w-0 flex-1 truncate text-[var(--color-space-text)]"
                }
              >
                {issue.title}
              </span>
            </li>
          ))}
        </ul>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  // Read the preference only after mount; the server can't know it, and guessing breaks hydration.
  const [still, setStill] = useState(false);
  useEffect(() => setStill(Boolean(prefersReducedMotion)), [prefersReducedMotion]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
    <section ref={sectionRef} className="space-panel orbit-hero relative min-h-[100svh] overflow-hidden rounded-none border-x-0 border-t-0">
      {/* The 3D system sits behind the content, weighted to the right on wide screens. */}
      <div className="pointer-events-none absolute inset-0 max-lg:opacity-60 lg:left-[25%]">
        <OrbitScene triggerRef={sectionRef} animate={!still} visible={visible} />
      </div>
      {/* Keeps the headline readable over the scene. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,22,0.92)_0%,rgba(11,13,22,0.7)_38%,rgba(11,13,22,0)_70%)] max-lg:bg-[linear-gradient(180deg,rgba(11,13,22,0.35)_0%,rgba(11,13,22,0.85)_60%)]"
        aria-hidden="true"
      />

      <div className="relative">
        <SiteHeader tone="space" />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pb-24 pt-16 sm:px-8 lg:min-h-[calc(100svh-84px)] lg:grid-cols-[1.2fr_0.8fr] lg:pb-32 lg:pt-8">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[var(--color-space-muted)] backdrop-blur"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d] shadow-[0_0_8px_#ff8a3d]" aria-hidden="true" />
              Sprint planning for product teams
            </motion.p>

            <h1 className="mt-7 max-w-[13ch] font-display text-[clamp(2.6rem,5.4vw,4.6rem)] font-semibold leading-[1] tracking-[-0.055em] text-[var(--color-space-text)]">
              <span className="sr-only">Know where every sprint stands.</span>
              <span aria-hidden="true" className="flex flex-wrap gap-x-[0.25em]">
                {HEADLINE.map((word, index) => (
                  <span key={word} className="inline-block overflow-hidden pb-[0.08em]">
                    <motion.span
                      className="inline-block"
                      initial={{ y: "110%", rotate: 4 }}
                      animate={{ y: "0%", rotate: 0 }}
                      transition={{ duration: 1.1, delay: 0.35 + index * 0.09, ease: EASE }}
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.9, ease: EASE }}
              className="mt-8 max-w-[48ch] text-lg leading-relaxed text-[var(--color-space-muted)]"
            >
              Orbit puts your backlog, board, ideas and flowcharts in one fast workspace, and draws each sprint as an orbit you can
              read in a second: what&apos;s done, what&apos;s moving, and how much time is left.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1.05, ease: EASE }}
              className="mt-10 flex flex-wrap gap-3"
            >
              <Link
                href={getAppUrl("/register")}
                className="group relative overflow-hidden rounded-lg bg-[#9d90ff] px-6 py-3.5 text-sm font-semibold text-[#0b0820] shadow-[0_0_40px_-8px_rgba(157,144,255,0.8)] transition-shadow hover:shadow-[0_0_56px_-6px_rgba(157,144,255,0.95)]"
              >
                <span className="relative z-10">Create your workspace</span>
                <span
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/features"
                className="rounded-lg border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-[var(--color-space-text)] backdrop-blur transition-colors hover:bg-white/[0.08]"
              >
                Tour the product
              </Link>
            </motion.div>
          </div>

          <div className="flex justify-center lg:translate-y-24 lg:justify-end">
            <SprintCard still={still} />
          </div>
        </div>
      </div>

      <motion.a
        href="#product"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.2, duration: 1 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-[var(--color-space-muted)] hover:text-[var(--color-space-text)] lg:flex"
      >
        Scroll to explore
        <span className="relative h-9 w-[1px] overflow-hidden bg-white/15" aria-hidden="true">
          {!still ? (
            <motion.span
              className="absolute left-0 top-0 h-3 w-[1px] bg-[#ff8a3d]"
              animate={{ y: [-12, 36] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            />
          ) : null}
        </span>
      </motion.a>
    </section>
    </MotionConfig>
  );
}
