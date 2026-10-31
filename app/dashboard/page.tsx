"use client";

import { useState } from "react";
import { Building2, User } from "lucide-react";

import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ExecutiveOrgSummary } from "@/components/dashboard/ExecutiveOrgSummary";
import { FocusTimerWidget } from "@/components/dashboard/FocusTimerWidget";
import { SprintOrbitPanel } from "@/components/dashboard/SprintOrbitPanel";
import { UpNextList } from "@/components/dashboard/UpNextList";
import { UpcomingWidget } from "@/components/dashboard/UpcomingWidget";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [dashboardView, setDashboardView] = useState<"org" | "personal">("org");

  return (
    <div className="page-animate mx-auto max-w-[1280px] space-y-6">
      <DashboardHeader />

      {/* Segmented View Switcher: Organization Overview vs Personal Overview */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-secondary)] pb-3">
        <div className="flex items-center rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-1">
          <button
            type="button"
            onClick={() => setDashboardView("org")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              dashboardView === "org"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
            )}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Organization Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setDashboardView("personal")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              dashboardView === "personal"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]",
            )}
          >
            <User className="h-3.5 w-3.5" />
            <span>My Overview</span>
          </button>
        </div>

        <span className="hidden text-xs text-[var(--color-text-tertiary)] sm:inline">
          {dashboardView === "org" ? "Company-wide execution & project velocity" : "Your daily priorities & focus session"}
        </span>
      </div>

      {/* Conditional View Rendering */}
      {dashboardView === "org" ? (
        /* Organization View */
        <div className="space-y-6">
          <ExecutiveOrgSummary />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <SprintOrbitPanel />
            <ActivityFeed />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <UpcomingWidget />
            <UpNextList />
          </div>
        </div>
      ) : (
        /* Personal Overview */
        <div className="space-y-6">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <UpNextList />
            <FocusTimerWidget />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <UpcomingWidget />
            <ActivityFeed />
          </div>
        </div>
      )}
    </div>
  );
}
