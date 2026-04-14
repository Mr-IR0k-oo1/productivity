import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickTasksList } from "@/components/dashboard/QuickTasksList";

export default function DashboardPage() {
  return (
    <div className="page-animate space-y-6">
      <DashboardHeader />

      <DashboardStats />

      <section className="grid gap-4 xl:grid-cols-2">
        <QuickTasksList />
        <ActivityFeed />
      </section>
    </div>
  );
}
