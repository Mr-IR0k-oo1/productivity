"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

function useGreeting() {
  const [greeting, setGreeting] = useState("Good morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 17) setGreeting("Good evening");
    else if (hour >= 12) setGreeting("Good afternoon");
    else setGreeting("Good morning");
  }, []);

  return greeting;
}

function useDateString() {
  const [date, setDate] = useState("");

  useEffect(() => {
    setDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return date;
}

export function DashboardHeader() {
  const greeting = useGreeting();
  const dateStr = useDateString();

  return (
    <section className="orbit-card orbit-card-glow overflow-hidden p-6">
      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--accent)]">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wider">{dateStr}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[var(--foreground)] md:text-3xl">
            {greeting}, founder
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Here&apos;s what&apos;s happening across your workspace today.
          </p>
        </div>

        <Link
          href="/my-day"
          className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-500/20 transition-all hover:shadow-blue-500/30 hover:brightness-110 md:self-start"
        >
          Open My Day
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </section>
  );
}
