"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useProfileQuery } from "@/hooks/useProfile";

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
  const profile = useProfileQuery().data;
  const firstName = profile?.fullName?.trim().split(/\s+/)[0];

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-[var(--muted)]">{dateStr}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {firstName ? `${greeting}, ${firstName}` : greeting}
        </h1>
      </div>

      <Link
        href="/my-day"
        className="inline-flex h-9 items-center rounded-md border border-[color:var(--card-border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface-hover)] sm:self-start"
      >
        Plan my day
      </Link>
    </header>
  );
}
