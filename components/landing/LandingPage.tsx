"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";

import { LoadingState } from "@/components/ui/loading-state";

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
    <main className="relative flex min-h-screen items-center justify-center">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-1/4 h-[400px] w-[400px] rounded-full bg-[var(--accent)]/8 blur-[100px]" />
        <div className="absolute right-1/3 bottom-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/8 blur-[80px]" />
      </div>

      <div className="w-full max-w-2xl px-8 text-center">
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-zinc-400">
            <Sparkles className="h-4 w-4 text-[var(--accent)]" />
            <span>Private launchpad</span>
          </div>
        </div>

        <h1 className="mb-6 text-4xl font-bold tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl">
          <span className="bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            Give your work
          </span>
          <br />
          <span className="bg-gradient-to-r from-[var(--accent)] to-violet-400 bg-clip-text text-transparent">
            a place to orbit.
          </span>
        </h1>

        <p className="mb-10 text-lg text-zinc-400 sm:text-xl">
          Small launches compound faster than perfect plans. Keep your ideas, tasks, and flowcharts in one calm place.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button className="h-11 px-8 text-base" asChild>
            <Link href="/auth">
              Get started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Link href="/auth?tab=login" className="text-sm text-zinc-500 transition-colors hover:text-zinc-300">
            Already have an account?
          </Link>
        </div>
      </div>
    </main>
  );
}