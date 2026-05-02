import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { FocusTimerWidget } from "@/components/dashboard/FocusTimerWidget";
import { QuickTasksList } from "@/components/dashboard/QuickTasksList";
import { UpcomingWidget } from "@/components/dashboard/UpcomingWidget";

export default function DashboardPage() {
  return (
    <div className="page-animate mx-auto max-w-[1400px] space-y-6">
      {/* Greeting Header */}
      <DashboardHeader />

      {/* Stats Grid */}
      <DashboardStats />

      {/* Main Content Grid */}
      <section className="grid gap-5 lg:grid-cols-3">
        {/* Left column: Tasks + Activity */}
        <div className="space-y-5 lg:col-span-2">
          <QuickTasksList />
          <ActivityFeed />
        </div>

        {/* Right column: Timer + Upcoming */}
        <div className="space-y-5">
          <FocusTimerWidget />
          <UpcomingWidget />
        </div>
      </section>
    </div>
  );
}
