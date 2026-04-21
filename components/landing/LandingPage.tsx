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
    <main className="relative min-h-screen overflow-hidden bg-[#01040f]">
      <AsciiBackground />
      <ThreeSpaceLayer />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_36%,rgba(16,46,96,0.18)_0%,rgba(6,16,36,0.52)_48%,rgba(1,4,11,0.9)_100%)]" />

      <div className="relative z-10 flex min-h-screen items-center px-6 py-14 sm:px-10 lg:px-16">
        <div className="w-full max-w-[560px] text-left text-slate-100 [text-shadow:0_2px_24px_rgba(0,0,0,0.62)]">
          <p className="text-xs uppercase tracking-[0.34em] text-sky-400/70 sm:text-sm">Orbit Workspace Platform</p>
          <div className="mb-8 mt-6 h-px w-14 bg-sky-500/45" />

          <h1
            className="mb-8 text-[clamp(3.1rem,9vw,6.4rem)] leading-[0.9] font-normal italic tracking-[-0.02em]"
            style={{ fontFamily: "\"Iowan Old Style\", \"Palatino Linotype\", \"Book Antiqua\", Palatino, serif" }}
          >
            <span className="block text-slate-100/95">Your work</span>
            <span className="block text-sky-400">in one</span>
            <span className="block text-sky-400">orbit</span>
          </h1>

          <p className="max-w-[500px] text-lg leading-relaxed text-slate-300/55 sm:text-[1.25rem]">
            Orbit brings ideas, tasks, and flowcharts
            <br />
            into one calm, focused workspace.
          </p>

          <div className="mt-12 flex flex-wrap gap-4">
            <Button
              className="h-14 min-w-[210px] rounded-2xl border border-sky-300/25 bg-sky-400/85 px-8 text-lg font-medium tracking-[0.03em] text-slate-950 hover:bg-sky-300"
              asChild
            >
              <Link href="/auth">Enter Orbit</Link>
            </Button>

            <Button
              variant="secondary"
              className="h-14 min-w-[190px] rounded-2xl border border-sky-500/35 bg-transparent px-8 text-lg font-medium text-sky-200 hover:bg-sky-500/12 hover:text-sky-100"
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

      <div className="pointer-events-none absolute bottom-8 right-6 z-10 text-right text-[0.68rem] uppercase tracking-[0.15em] text-sky-300/24 sm:bottom-12 sm:right-10 sm:text-xs">
        <p>IDEAS - TASKS - FLOWCHARTS</p>
        <p className="mt-2">ONE WORKSPACE - REAL MOMENTUM</p>
      </div>
    </main>
  );
}
