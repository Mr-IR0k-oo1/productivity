import Link from "next/link";

import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface)] p-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">Dashboard Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">Welcome back, founder</p>
      </div>

      <Button asChild variant="secondary" className="md:self-start">
        <Link href="/my-day">Open My Day</Link>
      </Button>
    </section>
  );
}
