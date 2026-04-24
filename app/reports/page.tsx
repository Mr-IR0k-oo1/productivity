"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { apiFetch } from "@/lib/api";
import { Calendar, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReportsData {
  summary: {
    tasksCompleted: number;
    totalTimeMinutes: number;
    activeMembers: number;
    ideasConverted: number;
  };
  tasksByDay: Array<{ date: string; completed: number; created: number }>;
  timeByProject: Array<{ name: string; minutes: number; color: string }>;
  velocityByWeek: Array<{ week: string; velocity: number }>;
  workloadByMember: Array<{ name: string; taskCount: number; timeMinutes: number }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ""}`.trim() : `${m}m`;
}

const COLORS = ["#3b8beb", "#a78bfa", "#22c55e", "#e8b86d", "#f472b6", "#38bdf8"];

const PRESET_RANGES = [
  { label: "Last 7d",  days: 7  },
  { label: "Last 30d", days: 30 },
  { label: "Last 90d", days: 90 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [rangeDays, setRangeDays] = useState(30);

  const from = format(subDays(startOfDay(new Date()), rangeDays), "yyyy-MM-dd");
  const to   = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading, isError } = useQuery<ReportsData>({
    queryKey: ["reports", from, to],
    queryFn: async () => {
      const res = await apiFetch(`/api/reports?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Failed to load reports");
      return res.json();
    },
  });

  if (isLoading) return (
    <div className="max-w-5xl mx-auto p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-64 bg-muted rounded-xl" />)}
      </div>
    </div>
  );

  if (isError) return (
    <div className="max-w-5xl mx-auto p-6 text-center text-muted-foreground py-24">
      Failed to load report data. Please refresh.
    </div>
  );

  const { summary, tasksByDay, timeByProject, velocityByWeek, workloadByMember } = data!;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(from), "MMM d")} → {format(new Date(to), "MMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted">
          {PRESET_RANGES.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setRangeDays(days)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                rangeDays === days
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle2, label: "Tasks completed", value: summary.tasksCompleted, color: "text-green-500" },
          { icon: Clock,        label: "Time tracked",    value: fmtMinutes(summary.totalTimeMinutes), color: "text-blue-400" },
          { icon: TrendingUp,   label: "Active members",  value: summary.activeMembers,  color: "text-purple-400" },
          { icon: Calendar,     label: "Ideas converted", value: summary.ideasConverted, color: "text-amber-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <Icon size={16} className={`${color} mb-2`} />
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Tasks created vs completed */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-medium mb-4">Tasks created vs. completed</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tasksByDay} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(v) => format(new Date(v), "MMM d")} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="created"   name="Created"   fill="#6b7280" radius={[4,4,0,0]} />
              <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time by project */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-medium mb-4">Time by project</div>
          {timeByProject.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">No time logged yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={180}>
                <PieChart>
                  <Pie data={timeByProject} dataKey="minutes" nameKey="name"
                    cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {timeByProject.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [fmtMinutes(v), "Time"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {timeByProject.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="flex-1 truncate text-muted-foreground">{p.name}</span>
                    <span className="font-medium">{fmtMinutes(p.minutes)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Velocity trend */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-medium mb-4">Weekly velocity</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={velocityByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              />
              <Line dataKey="velocity" name="Tasks completed" stroke="#3b8beb" strokeWidth={2}
                dot={{ r: 3, fill: "#3b8beb" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Team workload */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-sm font-medium mb-4">Team workload</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workloadByMember} layout="vertical" barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number, name: string) => [name === "timeMinutes" ? fmtMinutes(v) : v, name === "timeMinutes" ? "Time" : "Tasks"]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="taskCount"   name="Tasks" fill="#3b8beb" radius={[0,4,4,0]} />
              <Bar dataKey="timeMinutes" name="Time"  fill="#a78bfa" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}


