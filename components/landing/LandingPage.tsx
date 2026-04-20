"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { AsciiBackground } from "./AsciiBackground";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
      <AsciiBackground />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-950 via-zinc-950/80 to-black opacity-60" />

      <div className="relative z-10 w-full max-w-xl px-6 text-center">
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