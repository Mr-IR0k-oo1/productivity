import { CheckSquare, Clock3, Lightbulb, TrendingUp } from "lucide-react";

import { StatCard } from "@/components/common/StatCard";

const stats = [
  { title: "Total Tasks", value: "24", delta: "+3 from last week", icon: CheckSquare },
  { title: "Active Ideas", value: "12", delta: "+5 from last week", icon: Lightbulb },
  { title: "Hours Tracked", value: "156", delta: "+12 from last week", icon: Clock3 },
  { title: "Completed", value: "89%", delta: "+5% from last week", icon: TrendingUp },
] as const;

export function DashboardStats() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} delta={stat.delta} icon={stat.icon} />
      ))}
    </section>
  );
}
