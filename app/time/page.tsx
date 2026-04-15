"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Plus,
  Square,
  Timer,
  UserRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import { useStartTimerMutation, useStopTimerMutation, useTimeEntriesQuery } from "@/hooks/useTimeEntries";
import { cn } from "@/lib/utils";

type TimeView = "my" | "team" | "reports";
type ApprovalState = "Pending" | "Approved" | "Rejected";

const weeklyHours = [4.25, 5.0, 6.5, 7.0, 5.75, 3.25, 2.0];

const logs = [
  {
    date: "Apr 14",
    task: "Design new dashboard",
    start: "09:15",
    end: "11:45",
    duration: "2h 30m",
    billable: true,
    project: "Pulse v2",
  },
  {
    date: "Apr 14",
    task: "Review API documentation",
    start: "14:00",
    end: "15:30",
    duration: "1h 30m",
    billable: false,
    project: "Platform",
  },
  {
    date: "Apr 13",
    task: "Sprint planning",
    start: "10:00",
    end: "12:15",
    duration: "2h 15m",
    billable: true,
    project: "Core",
  },
  {
    date: "Apr 12",
    task: "Customer call notes",
    start: "16:30",
    end: "17:10",
    duration: "40m",
    billable: false,
    project: "Growth",
  },
];

const teamLogs = [
  { member: "Alice", date: "Apr 14", hours: 8.5, status: "Pending" as ApprovalState },
  { member: "Bala", date: "Apr 14", hours: 7.25, status: "Approved" as ApprovalState },
  { member: "Chitra", date: "Apr 13", hours: 6.75, status: "Rejected" as ApprovalState },
  { member: "Dev", date: "Apr 12", hours: 8.0, status: "Pending" as ApprovalState },
];

const budgetData = [
  { label: "Mon", estimated: 6, actual: 4.25 },
  { label: "Tue", estimated: 6, actual: 5.0 },
  { label: "Wed", estimated: 6, actual: 6.5 },
  { label: "Thu", estimated: 6, actual: 7.0 },
  { label: "Fri", estimated: 6, actual: 5.75 },
  { label: "Sat", estimated: 4, actual: 3.25 },
  { label: "Sun", estimated: 3, actual: 2.0 },
];

const trendData = [
  { label: "W1", hours: 38, tasks: 11 },
  { label: "W2", hours: 42, tasks: 14 },
  { label: "W3", hours: 39, tasks: 13 },
  { label: "W4", hours: 45, tasks: 16 },
];

const projectBreakdown = [
  { name: "Pulse v2", value: 176, color: "#22c55e" },
  { name: "Platform", value: 142, color: "#3b82f6" },
  { name: "Growth", value: 94, color: "#a1a1aa" },
  { name: "Ops", value: 75, color: "#ef4444" },
];

const weekdays = [
  { day: "Mon", hours: 4.25 },
  { day: "Tue", hours: 5.0 },
  { day: "Wed", hours: 6.5 },
  { day: "Thu", hours: 7.0 },
  { day: "Fri", hours: 5.75 },
  { day: "Sat", hours: 3.25 },
  { day: "Sun", hours: 2.0 },
];

function ApprovalBadge({ status }: { status: ApprovalState }) {
  const variants: Record<ApprovalState, "success" | "warning" | "default"> = {
    Pending: "warning",
    Approved: "success",
    Rejected: "default",
  };

  return <Badge variant={variants[status]}>{status}</Badge>;
}

function TimeLogTable({ rows }: { rows: typeof logs }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-900">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-zinc-950/70 text-zinc-500">
          <tr>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Task / Project</th>
            <th className="px-3 py-2">Start Time</th>
            <th className="px-3 py-2">End Time</th>
            <th className="px-3 py-2">Duration</th>
            <th className="px-3 py-2">Billable</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.date}-${row.task}`} className="border-t border-zinc-900 text-zinc-200">
              <td className="px-3 py-2.5">{row.date}</td>
              <td className="px-3 py-2.5">
                <p>{row.task}</p>
                <p className="text-xs text-zinc-500">{row.project}</p>
              </td>
              <td className="px-3 py-2.5">{row.start}</td>
              <td className="px-3 py-2.5">{row.end}</td>
              <td className="px-3 py-2.5">{row.duration}</td>
              <td className="px-3 py-2.5">{row.billable ? <Badge variant="success">Yes</Badge> : <Badge variant="default">No</Badge>}</td>
              <td className="px-3 py-2.5">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary">Edit</Button>
                  <Button size="sm" variant="secondary" className="border-red-900 text-red-200">Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeeklyCalendarStrip() {
  return (
    <div className="grid gap-2 sm:grid-cols-7">
      {weekdays.map((day) => (
        <div key={day.day} className="rounded-lg border border-zinc-900 bg-zinc-950/50 p-3 text-center">
          <p className="text-sm font-medium text-zinc-200">{day.day}</p>
          <p className="mt-1 text-xs text-zinc-500">{day.hours}h</p>
          <div className="mt-3 h-2 rounded-full bg-zinc-900">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (day.hours / 8) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TimeChart() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Time vs Estimate Comparison</CardTitle>
          <CardDescription>Over / under estimated values for the current week.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetData}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip />
              <Legend />
              <Bar dataKey="estimated" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="actual" fill="#22c55e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Weekly Trend</CardTitle>
          <CardDescription>Hours tracked and task throughput over the last four weeks.</CardDescription>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hours" stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function MyTimesheetView() {
  return (
    <div className="space-y-4">
      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Weekly Calendar Strip</CardTitle>
          <CardDescription>Mon-Sun hours logged at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyCalendarStrip />
        </CardContent>
      </Card>

      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Daily Log Table</CardTitle>
          <CardDescription>Manual entries, edits and deletions for current timesheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <TimeLogTable rows={logs} />
          <div className="mt-4 flex justify-end">
            <Button>
              <Plus className="h-4 w-4" />
              Add Manual Entry
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamTimesheetView() {
  return (
    <div className="space-y-4">
      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Team Timesheet Approvals</CardTitle>
          <CardDescription>Filter, review and bulk approve logs.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Filter by member" />
          <Input placeholder="Filter by date" />
          <Button>Bulk Approve</Button>
        </CardContent>
      </Card>

      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Member Logs</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-950/70 text-zinc-500">
              <tr>
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Hours</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {teamLogs.map((row) => (
                <tr key={`${row.member}-${row.date}`} className="border-t border-zinc-900 text-zinc-200">
                  <td className="px-3 py-2.5 flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-zinc-500" />
                    {row.member}
                  </td>
                  <td className="px-3 py-2.5">{row.date}</td>
                  <td className="px-3 py-2.5">{row.hours}h</td>
                  <td className="px-3 py-2.5"><ApprovalBadge status={row.status} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary">
                        Approve
                      </Button>
                      <Button size="sm" variant="secondary" className="border-red-900 text-red-200">
                        Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReportsView() {
  return <TimeChart />;
}

function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");

  return `${hours}:${minutes}:${remainingSeconds}`;
}

function TimerPanel({
  isRunning,
  description,
  elapsedLabel,
  onStop,
  isStopping,
}: {
  isRunning: boolean;
  description: string;
  elapsedLabel: string;
  onStop: () => void;
  isStopping: boolean;
}) {
  return (
    <Card className="border-emerald-950/60 bg-zinc-950/70">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base text-emerald-300">Currently tracking</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Badge variant={isRunning ? "success" : "default"}>{isRunning ? "Running" : "Stopped"}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-semibold tracking-tight text-zinc-100">{elapsedLabel}</div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input value={description} readOnly />
          <Button variant="secondary" disabled>
            <Timer className="h-4 w-4" />
            Active
          </Button>
          <Button
            variant="secondary"
            className="border-red-900 text-red-200"
            onClick={onStop}
            disabled={!isRunning || isStopping}
          >
            <Square className="h-4 w-4" />
            {isStopping ? "Stopping" : "Stop"}
          </Button>
        </div>
        <Input placeholder="Notes" value={description} readOnly />
      </CardContent>
    </Card>
  );
}

export default function TimePage() {
  const [view, setView] = useState<TimeView>("my");
  const [weekMode, setWeekMode] = useState("Current Week");
  const [now, setNow] = useState(Date.now());

  const timeEntriesQuery = useTimeEntriesQuery();
  const startTimerMutation = useStartTimerMutation();
  const stopTimerMutation = useStopTimerMutation();

  const runningEntry = useMemo(
    () => timeEntriesQuery.data?.find((entry) => entry.isRunning) ?? null,
    [timeEntriesQuery.data],
  );

  useEffect(() => {
    if (!runningEntry) {
      return;
    }

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [runningEntry]);

  const runningSeconds = useMemo(() => {
    if (!runningEntry) {
      return 0;
    }

    const startedAtMs = new Date(runningEntry.startedAt).getTime();
    return Math.max(0, Math.floor((now - startedAtMs) / 1000));
  }, [now, runningEntry]);

  const totalHoursThisWeek = useMemo(
    () => weeklyHours.reduce((sum, value) => sum + value, 0).toFixed(1),
    [],
  );

  const timerDescription = runningEntry?.description?.trim() || "Focus session";

  if (timeEntriesQuery.isLoading) {
    return <LoadingState label="Loading time entries" description="Preparing your timer and timesheet data" />;
  }

  if (timeEntriesQuery.error) {
    return (
      <ErrorState
        message={timeEntriesQuery.error instanceof Error ? timeEntriesQuery.error.message : "Could not load time entries"}
        onRetry={() => {
          void timeEntriesQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="page-animate space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Time Tracking</h1>
          <p className="mt-1 text-sm text-zinc-400">Track time, approve logs and inspect team utilization.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={weekMode}
            onChange={(e) => setWeekMode(e.target.value)}
            className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
          >
            <option value="Current Week">Current Week</option>
            <option value="Current Month">Current Month</option>
          </select>
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button variant="secondary">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              startTimerMutation.mutate({ description: "Focus session" });
            }}
            disabled={Boolean(runningEntry) || startTimerMutation.isPending}
          >
            <Timer className="h-4 w-4" />
            {startTimerMutation.isPending ? "Starting" : "Start Timer"}
          </Button>
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Export Timesheet
          </Button>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Total Hours This Week</p>
            <CardTitle className="text-3xl font-semibold">{totalHoursThisWeek}h</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-emerald-400">+4.2h from last week</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Budget Status</p>
            <CardTitle className="text-3xl font-semibold text-amber-300">85%</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">You&apos;re at 85% of estimated time</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Pending Approvals</p>
            <CardTitle className="text-3xl font-semibold">2</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">Ready for manager review</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Tracked Projects</p>
            <CardTitle className="text-3xl font-semibold">6</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-400">Active in this period</p>
          </CardContent>
        </Card>
      </section>

      <TimerPanel
        isRunning={Boolean(runningEntry)}
        description={timerDescription}
        elapsedLabel={formatElapsed(runningSeconds)}
        onStop={() => {
          if (!runningEntry) {
            return;
          }

          stopTimerMutation.mutate(runningEntry.id);
        }}
        isStopping={stopTimerMutation.isPending}
      />

      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "my", label: "My Timesheet" },
              { id: "team", label: "Team Timesheet" },
              { id: "reports", label: "Reports" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setView(item.id as TimeView)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  view === item.id
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                    : "border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-zinc-200",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {view === "my" ? <MyTimesheetView /> : null}
      {view === "team" ? <TeamTimesheetView /> : null}
      {view === "reports" ? <ReportsView /> : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader>
            <CardTitle className="text-base">Time Breakdown by Project</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={projectBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                  {projectBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Most Tracked Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              ["Design new dashboard", "12h 30m"],
              ["Review API documentation", "8h 45m"],
              ["Sprint planning", "6h 15m"],
              ["Customer call notes", "4h 05m"],
            ].map((row) => (
              <div key={row[0]} className="flex items-center justify-between rounded-md border border-zinc-900 bg-zinc-950/50 px-3 py-2.5">
                <p className="text-sm text-zinc-200">{row[0]}</p>
                <Badge variant="default">{row[1]}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="border-zinc-900 bg-zinc-950/40">
        <CardContent className="pt-6 text-sm text-zinc-400">
          Time page scaffold complete with timer controls, logs, approvals, and insights ready for backend integration.
        </CardContent>
      </Card>
    </div>
  );
}
