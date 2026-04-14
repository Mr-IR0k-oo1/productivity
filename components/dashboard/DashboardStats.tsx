import { StatCard } from "@/components/common/StatCard";

const stats = [
  { title: "Total Tasks", value: "24", trend: "+3 from last week" },
  { title: "Active Ideas", value: "12", trend: "+5 from last week" },
  { title: "Hours Tracked", value: "156", trend: "+12 from last week" },
  { title: "Completed", value: "89%", trend: "+5% from last week", positive: true },
];

export function DashboardStats() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          trend={stat.trend}
          positive={stat.positive}
        />
      ))}
    </section>
  );
}
