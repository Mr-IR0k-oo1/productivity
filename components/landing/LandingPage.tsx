"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-950 via-zinc-900 to-black" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-[var(--accent)]/5 blur-[120px]" />
        <div className="absolute left-1/3 top-1/3 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-700/30 to-transparent" />
        <div className="absolute left-1/3 top-2/3 h-[1px] w-full bg-gradient-to-r from-transparent via-zinc-700/20 to-transparent" />
        <div className="absolute left-[20%] top-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-zinc-700/20 to-transparent" />
        <div className="absolute left-[80%] top-1/2 h-full w-[1px] bg-gradient-to-b from-transparent via-zinc-700/20 to-transparent" />
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-white/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-xl px-6 text-center">
        <h1 className="mb-8 text-5xl font-semibold tracking-tight text-zinc-100 sm:text-6xl">
          <span className="bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Orbit.
          </span>
        </h1>

        <p className="mb-12 text-zinc-500">
          Your ideas, tasks, and flowcharts in one quiet place.
        </p>

        <Button className="h-10 px-6" asChild>
          <Link href="/auth">
            Enter
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </main>
  );
}