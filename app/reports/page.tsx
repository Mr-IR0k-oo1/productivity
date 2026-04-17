"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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
  Activity,
  Check,
  Copy,
  Download,
  Filter,
  FolderKanban,
  Link2,
  Mail,
  RefreshCw,
  Timer,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { format } from "date-fns";

import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DateRange = "7d" | "30d" | "90d" | "custom";
type ReportTab = "productivity" | "team" | "time" | "projects" | "activity";

const tabs: Array<{ id: ReportTab; label: string }> = [
  { id: "productivity", label: "Productivity Overview" },
  { id: "team", label: "Team Performance" },
  { id: "time", label: "Time Tracking" },
  { id: "projects", label: "Project / Goal Progress" },
  { id: "activity", label: "Activity Summary" },
];

const kpis = [
  { title: "Total Tasks Completed", value: "142", trend: "+18 from last period", positive: true },
  { title: "Total Hours Tracked", value: "487h", trend: "+42h", positive: true },
  { title: "Average Completion Rate", value: "87%", trend: "+5%", positive: true },
  { title: "Active Projects", value: "8", trend: "2 overdue", positive: false },
];

const trendData = [
  { date: "Mon", completed: 18, hours: 42 },
  { date: "Tue", completed: 22, hours: 50 },
  { date: "Wed", completed: 19, hours: 46 },
  { date: "Thu", completed: 27, hours: 58 },
  { date: "Fri", completed: 31, hours: 63 },
  { date: "Sat", completed: 12, hours: 28 },
  { date: "Sun", completed: 13, hours: 31 },
];

const productivityBars = [
  { period: "W1", score: 72 },
  { period: "W2", score: 79 },
  { period: "W3", score: 76 },
  { period: "W4", score: 88 },
];

const statusDist = [
  { name: "Done", value: 58, color: "#22c55e" },
  { name: "In Progress", value: 23, color: "#3b82f6" },
  { name: "To Do", value: 14, color: "#a1a1aa" },
  { name: "Overdue", value: 5, color: "#ef4444" },
];

const teamRows = [
  { name: "Alice", tasks: 34, hours: 98, completion: 92, onTime: 95, load: "Overloaded" },
  { name: "Bala", tasks: 28, hours: 86, completion: 89, onTime: 91, load: "Balanced" },
  { name: "Chitra", tasks: 24, hours: 74, completion: 84, onTime: 88, load: "Balanced" },
  { name: "Dev", tasks: 19, hours: 59, completion: 77, onTime: 81, load: "Underloaded" },
];

const heatmap = [
  ["Alice", 88, 92, 95, 90, 86],
  ["Bala", 73, 78, 82, 79, 76],
  ["Chitra", 66, 70, 75, 74, 69],
  ["Dev", 42, 45, 51, 47, 41],
];

const timeBreakdown = [
  { name: "Billable", value: 342, color: "#22c55e" },
  { name: "Non-billable", value: 145, color: "#3b82f6" },
];

const varianceData = [
  { task: "Onboarding Revamp", variance: 18 },
  { task: "Billing API", variance: -9 },
  { task: "Growth Dashboard", variance: 12 },
  { task: "Calendar Sync", variance: -4 },
];

const burndown = [
  { day: "D1", planned: 100, actual: 100 },
  { day: "D2", planned: 88, actual: 92 },
  { day: "D3", planned: 76, actual: 79 },
  { day: "D4", planned: 64, actual: 67 },
  { day: "D5", planned: 52, actual: 58 },
  { day: "D6", planned: 40, actual: 43 },
  { day: "D7", planned: 28, actual: 30 },
  { day: "D8", planned: 16, actual: 20 },
  { day: "D9", planned: 8, actual: 10 },
  { day: "D10", planned: 0, actual: 3 },
];

const projects = [
  { name: "Pulse v2 Launch", progress: 82, overdue: false },
  { name: "Client Onboarding Automation", progress: 63, overdue: false },
  { name: "RevOps Dashboard", progress: 48, overdue: true },
  { name: "Calendar Reliability Sprint", progress: 71, overdue: false },
];

function clsx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function ProgressBar({ value, overdue = false }: { value: number; overdue?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="h-2 w-full rounded-full bg-zinc-900">
        <div
          className={clsx(
            "h-2 rounded-full",
            overdue ? "bg-red-500" : value >= 75 ? "bg-emerald-500" : "bg-blue-500",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-zinc-400">{value}%</p>
    </div>
  );
}

function ReportHeader({
  dateRange,
  setDateRange,
  exportType,
  setExportType,
  workspace,
  setWorkspace,
  memberFilter,
  setMemberFilter,
  projectFilter,
  setProjectFilter,
  onExport,
  onRefresh,
  onShare,
  onSchedule,
  isRefreshing,
}: {
  dateRange: DateRange;
  setDateRange: (v: DateRange) => void;
  exportType: "PDF" | "Excel" | "CSV";
  setExportType: (v: "PDF" | "Excel" | "CSV") => void;
  workspace: string;
  setWorkspace: (v: string) => void;
  memberFilter: string;
  setMemberFilter: (v: string) => void;
  projectFilter: string;
  setProjectFilter: (v: string) => void;
  onExport: () => void;
  onRefresh: () => void;
  onShare: () => void;
  onSchedule: () => void;
  isRefreshing: boolean;
}) {
  return (
    <Card className="border-zinc-900 bg-zinc-950/60">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">Reports</CardTitle>
            <CardDescription>
              Productivity, progress, time usage and performance insights.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as "PDF" | "Excel" | "CSV")}
              className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
            >
              <option value="PDF">PDF</option>
              <option value="Excel">Excel</option>
              <option value="CSV">CSV</option>
            </select>
            <Button variant="secondary" onClick={onExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as DateRange)}
          className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="custom">Custom</option>
        </select>
        <select
          value={workspace}
          onChange={(e) => setWorkspace(e.target.value)}
          className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
        >
          <option value="PulseForge Core">PulseForge Core</option>
          <option value="Growth Lab">Growth Lab</option>
          <option value="Ops Team">Ops Team</option>
        </select>
        <Input
          value={memberFilter}
          onChange={(e) => setMemberFilter(e.target.value)}
          placeholder="Filter by member"
        />
        <Input
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          placeholder="Filter by project"
        />
        <Button variant="secondary" onClick={onShare}>
          <Link2 className="h-4 w-4" />
          Share Link
        </Button>
        <Button variant="secondary" onClick={onSchedule}>
          <Mail className="h-4 w-4" />
          Schedule Weekly
        </Button>
      </CardContent>
    </Card>
  );
}

function ShareLinkModal({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Share Report Link</CardTitle>
            <button type="button" onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <p className="text-sm text-zinc-400">Copy this link to share the current report view:</p>
          <div className="flex gap-2">
            <Input value={window.location.href} readOnly className="flex-1" />
            <Button onClick={handleCopy} variant={copied ? "secondary" : "default"}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          {copied && <p className="text-sm text-emerald-400">Copied to clipboard!</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function ScheduleReportModal({ onClose, email, setEmail, frequency, setFrequency, onSchedule }: {
  onClose: () => void;
  email: string;
  setEmail: (v: string) => void;
  frequency: string;
  setFrequency: (v: string) => void;
  onSchedule: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Schedule Report</CardTitle>
            <button type="button" onClick={onClose} className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Email address</label>
            <Input
              type="email"
              placeholder="team@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-zinc-900 pt-4">
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={onSchedule} disabled={!email}>Schedule</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamTable({ rows }: { rows: typeof teamRows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-900">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-zinc-950/70 text-zinc-500">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Tasks Completed</th>
            <th className="px-3 py-2">Hours Logged</th>
            <th className="px-3 py-2">Completion %</th>
            <th className="px-3 py-2">On-time Delivery %</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className="border-t border-zinc-900 text-zinc-200">
              <td className="px-3 py-2.5">{r.name}</td>
              <td className="px-3 py-2.5">{r.tasks}</td>
              <td className="px-3 py-2.5">{r.hours}</td>
              <td className="px-3 py-2.5">{r.completion}%</td>
              <td className="px-3 py-2.5">{r.onTime}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkloadHeatmap() {
  return (
    <div className="space-y-2">
      {heatmap.map((row) => (
        <div key={row[0] as string} className="grid grid-cols-6 gap-2">
          <p className="text-xs text-zinc-400">{row[0]}</p>
          {(row.slice(1) as number[]).map((v, idx) => (
            <div
              key={idx}
              className="h-8 rounded-md border border-zinc-900 text-center text-xs leading-8"
              style={{
                backgroundColor:
                  v > 85 ? "rgba(239,68,68,0.35)" : v > 65 ? "rgba(59,130,246,0.25)" : "rgba(34,197,94,0.18)",
                color: "#e4e4e7",
              }}
            >
              {v}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const [exportType, setExportType] = useState<"PDF" | "Excel" | "CSV">("PDF");
  const [workspace, setWorkspace] = useState("PulseForge Core");
  const [memberFilter, setMemberFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [tab, setTab] = useState<ReportTab>("productivity");
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFrequency, setScheduleFrequency] = useState("weekly");
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredTeam = useMemo(() => {
    return teamRows.filter((r) => (memberFilter ? r.name.toLowerCase().includes(memberFilter.toLowerCase()) : true));
  }, [memberFilter]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const byProject = projectFilter ? p.name.toLowerCase().includes(projectFilter.toLowerCase()) : true;
      const byOverdue = showOverdueOnly ? p.overdue : true;
      return byProject && byOverdue;
    });
  }, [projectFilter, showOverdueOnly]);

  const handleExport = () => {
    let content = "";
    let filename = "";
    const timestamp = format(new Date(), "yyyy-MM-dd");

    if (exportType === "CSV") {
      const headers = ["Report Type", "Value", "Trend"];
      const rows = kpis.map(k => [k.title, k.value, k.trend]);
      content = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
      filename = `report-${tab}-${timestamp}.csv`;
    } else {
      content = `Report: ${tab}\nGenerated: ${format(new Date(), "PPP")}\n\nKPI Summary:\n${kpis.map(k => `${k.title}: ${k.value}`).join("\n")}`;
      filename = `report-${tab}-${timestamp}.${exportType.toLowerCase()}`;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
    window.location.reload();
  };

  const handleCopyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScheduleReport = () => {
    if (!scheduleEmail) return;
    alert(`Report scheduled for ${scheduleEmail} (${scheduleFrequency})`);
    setShowScheduleModal(false);
    setScheduleEmail("");
  };

  return (
    <div className="page-animate space-y-6">
      <ReportHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        exportType={exportType}
        setExportType={setExportType}
        workspace={workspace}
        setWorkspace={setWorkspace}
        memberFilter={memberFilter}
        setMemberFilter={setMemberFilter}
        projectFilter={projectFilter}
        setProjectFilter={setProjectFilter}
        onExport={handleExport}
        onRefresh={handleRefresh}
        onShare={() => setShowShareModal(true)}
        onSchedule={() => setShowScheduleModal(true)}
        isRefreshing={isRefreshing}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            trend={kpi.trend}
            positive={kpi.positive}
          />
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={clsx(
                    "rounded-md border px-3 py-1.5 text-sm transition-colors",
                    tab === t.id
                      ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                      : "border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {tab === "productivity" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Tasks Completed vs Time Tracked</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
                        <Line type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Daily / Weekly Productivity</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productivityBars}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis dataKey="period" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip />
                        <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Task Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusDist} dataKey="value" nameKey="name" outerRadius={90} label>
                          {statusDist.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {tab === "team" ? (
              <div className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <Card className="border-zinc-900 bg-zinc-950/50 lg:col-span-1">
                    <CardHeader>
                      <CardTitle className="text-base">Leaderboard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="rounded-md border border-zinc-900 p-3">
                        <p className="text-sm text-zinc-200">Alice</p>
                        <p className="text-xs text-zinc-500">34 tasks, 98h</p>
                      </div>
                      <div className="rounded-md border border-zinc-900 p-3">
                        <p className="text-sm text-zinc-200">Bala</p>
                        <p className="text-xs text-zinc-500">28 tasks, 86h</p>
                      </div>
                      <div className="rounded-md border border-zinc-900 p-3">
                        <p className="text-sm text-zinc-200">Chitra</p>
                        <p className="text-xs text-zinc-500">24 tasks, 74h</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-zinc-900 bg-zinc-950/50 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-base">Member-wise Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TeamTable rows={filteredTeam} />
                    </CardContent>
                  </Card>
                </div>
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Workload Heatmap</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <WorkloadHeatmap />
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {tab === "time" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Billable vs Non-billable</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={timeBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                          {timeBreakdown.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Time vs Estimate Variance</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={varianceData}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis dataKey="task" stroke="#a1a1aa" tick={false} />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip />
                        <Bar dataKey="variance">
                          {varianceData.map((item) => (
                            <Cell key={item.task} fill={item.variance >= 0 ? "#ef4444" : "#22c55e"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Weekly Timesheet Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 md:grid-cols-4">
                      <div className="rounded-md border border-zinc-900 p-3"><p className="text-sm text-zinc-200">Week 1</p><p className="text-xs text-zinc-500">121h</p></div>
                      <div className="rounded-md border border-zinc-900 p-3"><p className="text-sm text-zinc-200">Week 2</p><p className="text-xs text-zinc-500">116h</p></div>
                      <div className="rounded-md border border-zinc-900 p-3"><p className="text-sm text-zinc-200">Week 3</p><p className="text-xs text-zinc-500">128h</p></div>
                      <div className="rounded-md border border-zinc-900 p-3"><p className="text-sm text-zinc-200">Week 4</p><p className="text-xs text-zinc-500">122h</p></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {tab === "projects" ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Active Projects</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredProjects.map((p) => (
                      <div key={p.name} className="rounded-md border border-zinc-900 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-sm text-zinc-200">{p.name}</p>
                          {p.overdue ? <Badge variant="warning">Overdue</Badge> : <Badge variant="success">On Track</Badge>}
                        </div>
                        <ProgressBar value={p.progress} overdue={p.overdue} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Burndown Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={burndown}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis dataKey="day" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="planned" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50 lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Completion Trend</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip />
                        <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="#22c55e33" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {tab === "activity" ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Most Active Days / Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-zinc-200">Thursday, 10AM-1PM</p>
                    <p className="text-xs text-zinc-500">Peak productivity block</p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Top Commented Items</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-zinc-200">RevOps Dashboard Spec (42 comments)</p>
                    <p className="text-sm text-zinc-200">Billing Retry Logic (29 comments)</p>
                    <p className="text-sm text-zinc-200">Launch Playbook v3 (21 comments)</p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-900 bg-zinc-950/50">
                  <CardHeader>
                    <CardTitle className="text-base">Recent Highlights</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-zinc-200">Alice completed 8 tasks yesterday.</p>
                    <p className="text-sm text-zinc-200">Calendar sync incident resolved in 2h.</p>
                    <p className="text-sm text-zinc-200">Team completion stayed above 85% for 3 weeks.</p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Advanced Filters</CardTitle>
            <CardDescription>Member, label, priority, date and overdue controls.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-zinc-300">
              <Filter className="h-4 w-4" />
              <p className="text-sm">Filter by</p>
            </div>
            <Input value={memberFilter} onChange={(e) => setMemberFilter(e.target.value)} placeholder="Member(s)" />
            <Input value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} placeholder="Project" />
            <select
              value={labelFilter}
              onChange={(e) => setLabelFilter(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
            >
              <option value="all">All labels</option>
              <option value="product">Product</option>
              <option value="growth">Growth</option>
              <option value="engineering">Engineering</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={showOverdueOnly}
                onChange={(e) => setShowOverdueOnly(e.target.checked)}
              />
              Show overdue only
            </label>
            <div className="rounded-md border border-zinc-900 bg-zinc-950/50 p-3 text-xs text-zinc-500">
              Current sample top performer: Alice, 34 tasks, 98h.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardContent className="flex items-center gap-2 pt-6">
            <Users className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-zinc-300">Team insights ready</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardContent className="flex items-center gap-2 pt-6">
            <FolderKanban className="h-4 w-4 text-emerald-400" />
            <p className="text-sm text-zinc-300">Project trends updated</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardContent className="flex items-center gap-2 pt-6">
            <Timer className="h-4 w-4 text-blue-400" />
            <p className="text-sm text-zinc-300">Time variance monitored</p>
          </CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardContent className="flex items-center gap-2 pt-6">
            <Activity className="h-4 w-4 text-red-400" />
            <p className="text-sm text-zinc-300">Overdue risk surfaced</p>
          </CardContent>
        </Card>
      </section>

      <Card className="border-zinc-900 bg-zinc-950/40">
        <CardContent className="flex items-center gap-2 pt-6 text-sm text-zinc-400">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
          Reports page scaffold complete with dark-friendly charts, export controls, advanced filters, and share/schedule actions.
        </CardContent>
      </Card>

      {showShareModal && <ShareLinkModal onClose={() => setShowShareModal(false)} />}
      {showScheduleModal && (
        <ScheduleReportModal
          onClose={() => setShowScheduleModal(false)}
          email={scheduleEmail}
          setEmail={setScheduleEmail}
          frequency={scheduleFrequency}
          setFrequency={setScheduleFrequency}
          onSchedule={handleScheduleReport}
        />
      )}
    </div>
  );
}
