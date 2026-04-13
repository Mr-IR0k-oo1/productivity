import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { QuickTasks } from "@/components/dashboard/QuickTasks";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { WorkspaceHeader } from "@/components/layout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 text-white">
        <WorkspaceHeader title="Dashboard" subtitle="Welcome back! Here's what's happening." />
        <DashboardStats />
        <section className="grid gap-4 xl:grid-cols-7">
          <div className="xl:col-span-4">
            <QuickTasks />
          </div>
          <div className="xl:col-span-3">
            <RecentActivity />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
