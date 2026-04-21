"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { AsciiBackground } from "./AsciiBackground";
import { ThreeSpaceLayer } from "./ThreeSpaceLayer";

export function LandingPage() {
  const router = useRouter();
  const { isReady, userId } = useSessionContext();

  useEffect(() => {
    if (isReady && userId) {
      router.replace("/dashboard");
    }
  }, [isReady, router, userId]);

  if (!isReady || userId) {
    return <div className="flex min-h-screen items-center justify-center"><LoadingState label="Loading" description="Preparing your workspace" /></div>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent">
      <AsciiBackground />
      <ThreeSpaceLayer />

      <div className="absolute inset-0 bg-transparent" />

      <div className="relative z-10 flex min-h-screen items-center px-6 py-14 sm:px-10 lg:px-16">
        <div className="w-full max-w-[560px] text-left text-[var(--foreground)] [text-shadow:0_2px_24px_rgba(0,0,0,0.1)]">
          <p className="text-xs uppercase tracking-[0.34em] text-[var(--accent)] sm:text-sm">Orbit Workspace Platform</p>
          <div className="mb-8 mt-6 h-px w-14 bg-[var(--accent)] opacity-50" />

          <h1
            className="mb-8 text-[clamp(3.1rem,9vw,6.4rem)] leading-[0.9] font-normal italic tracking-[-0.02em]"
            style={{ fontFamily: "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Palatino, serif" }}
          >
            <span className="block text-[var(--foreground)]">Your work</span>
            <span className="block text-[var(--accent)]">in one</span>
            <span className="block text-[var(--accent)]">orbit</span>
          </h1>

          <p className="max-w-[500px] text-lg leading-relaxed text-[var(--muted)] sm:text-[1.25rem]">
            Orbit brings ideas, tasks, and flowcharts
            <br />
            into one calm, focused workspace.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Button
              className="h-14 min-w-[210px] rounded-2xl border border-[var(--accent)] bg-[var(--accent)] px-8 text-lg font-medium tracking-[0.03em] text-white hover:bg-[var(--accent-strong)]"
              asChild
            >
              <Link href="/auth">Enter Orbit</Link>
            </Button>

            <Button
              variant="secondary"
              className="h-14 min-w-[190px] rounded-2xl border border-[var(--accent)] bg-transparent px-8 text-lg font-medium text-[var(--foreground)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)]"
              asChild
            >
              <Link href="/auth">
                See Features
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-8 right-6 z-10 text-right text-[0.68rem] uppercase tracking-[0.15em] text-[var(--muted)] sm:bottom-12 sm:right-10 sm:text-xs">
        <p>IDEAS - TASKS - FLOWCHARTS</p>
        <p className="mt-2">ONE WORKSPACE - REAL MOMENTUM</p>
      </div>
    </main>
  );
}
