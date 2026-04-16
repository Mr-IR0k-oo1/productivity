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
  Calendar,
  Download,
  Pencil,
  Plus,
  Square,
  Timer,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, parseISO } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/ui/error-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";
import {
  useCreateTimeEntryMutation,
  useDeleteTimeEntryMutation,
  useStartTimerMutation,
  useStopTimerMutation,
  useTimeEntriesQuery,
  useUpdateTimeEntryMutation,
  type TimeEntryDTO,
} from "@/hooks/useTimeEntries";
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

function ManualEntryModal({
  entry,
  onClose,
  onSave,
  onDelete,
  isSaving,
  isDeleting,
}: {
  entry?: TimeEntryDTO;
  onClose: () => void;
  onSave: (data: { description: string; startedAt: string; endedAt: string; project: string }) => void;
  onDelete?: () => void;
  isSaving: boolean;
  isDeleting: boolean;
}) {
  const [description, setDescription] = useState(entry?.description || "");
  const [date, setDate] = useState(
    entry?.startedAt ? format(parseISO(entry.startedAt), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState(
    entry?.startedAt ? format(parseISO(entry.startedAt), "HH:mm") : "09:00"
  );
  const [endTime, setEndTime] = useState(
    entry?.endedAt ? format(parseISO(entry.endedAt), "HH:mm") : "10:00"
  );
  const [project, setProject] = useState("");

  const handleSubmit = () => {
    if (!description.trim()) return;

    const startedAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endedAt = new Date(`${date}T${endTime}:00`).toISOString();

    onSave({ description, startedAt, endedAt, project });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{entry ? "Edit Time Entry" : "Add Manual Entry"}</CardTitle>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Description *</label>
            <Input
              placeholder="What did you work on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Project</label>
              <Input
                placeholder="Project name"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Start time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">End time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-900 pt-4">
            {entry && onDelete && (
              <Button
                variant="secondary"
                className="bg-red-900/50 text-red-200 hover:bg-red-900"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!description.trim() || isSaving}>
              {isSaving ? "Saving..." : entry ? "Update" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TimeLogTable({
  entries,
  onEdit,
  onDelete,
}: {
  entries: TimeEntryDTO[];
  onEdit: (entry: TimeEntryDTO) => void;
  onDelete: (entryId: string) => void;
}) {
  const formatDuration = (entry: TimeEntryDTO) => {
    if (entry.durationMinutes) {
      const hours = Math.floor(entry.durationMinutes / 60);
      const mins = entry.durationMinutes % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
    if (entry.endedAt && entry.startedAt) {
      const diff = new Date(entry.endedAt).getTime() - new Date(entry.startedAt).getTime();
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
    }
    return "Running";
  };

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
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                No time entries yet. Start a timer or add a manual entry.
              </td>
            </tr>
          ) : (
            entries.map((entry) => (
              <tr key={entry.id} className="border-t border-zinc-900 text-zinc-200">
                <td className="px-3 py-2.5">{format(parseISO(entry.startedAt), "MMM d")}</td>
                <td className="px-3 py-2.5">
                  <p>{entry.description || "No description"}</p>
                </td>
                <td className="px-3 py-2.5">{format(parseISO(entry.startedAt), "HH:mm")}</td>
                <td className="px-3 py-2.5">
                  {entry.endedAt ? format(parseISO(entry.endedAt), "HH:mm") : "-"}
                </td>
                <td className="px-3 py-2.5">{formatDuration(entry)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onEdit(entry)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="border-red-900 text-red-200 hover:bg-red-900"
                      onClick={() => onDelete(entry.id)}
                      disabled={entry.isRunning}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function TimeChart({ entries }: { entries: TimeEntryDTO[] }) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const budgetData = days.map((label, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);
    const dayEntries = entries.filter(e => {
      const entryDate = parseISO(e.startedAt);
      return entryDate.toDateString() === dayDate.toDateString();
    });
    const actual = dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0) / 60;
    return { label, estimated: 6, actual: Math.round(actual * 10) / 10 };
  });

  const totalHours = entries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0) / 60;

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
          <CardTitle className="text-base">Weekly Summary</CardTitle>
          <CardDescription>Hours tracked this week.</CardDescription>
        </CardHeader>
        <CardContent className="flex h-72 flex-col items-center justify-center">
          <p className="text-6xl font-bold text-emerald-400">
            {totalHours > 0 ? totalHours.toFixed(1) : "0"}
          </p>
          <p className="mt-2 text-zinc-400">hours this week</p>
        </CardContent>
      </Card>
    </div>
  );
}

function MyTimesheetView({
  entries,
  onEdit,
  onDelete,
  onAddEntry,
}: {
  entries: TimeEntryDTO[];
  onEdit: (entry: TimeEntryDTO) => void;
  onDelete: (entryId: string) => void;
  onAddEntry: () => void;
}) {
  const weekdayData = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    return days.map((day, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(dayDate.getDate() + i);

      const dayEntries = entries.filter(e => {
        const entryDate = parseISO(e.startedAt);
        return entryDate.toDateString() === dayDate.toDateString();
      });

      const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0);

      return { day, hours: totalMinutes / 60 };
    });
  }, [entries]);

  return (
    <div className="space-y-4">
      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Weekly Calendar Strip</CardTitle>
          <CardDescription>Mon-Sun hours logged at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-7">
            {weekdayData.map((day) => (
              <div key={day.day} className="rounded-lg border border-zinc-900 bg-zinc-950/50 p-3 text-center">
                <p className="text-sm font-medium text-zinc-200">{day.day}</p>
                <p className="mt-1 text-xs text-zinc-500">{day.hours.toFixed(1)}h</p>
                <div className="mt-3 h-2 rounded-full bg-zinc-900">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${Math.min(100, (day.hours / 8) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-zinc-900 bg-zinc-950/50">
        <CardHeader>
          <CardTitle className="text-base">Daily Log Table</CardTitle>
          <CardDescription>Manual entries, edits and deletions for current timesheet.</CardDescription>
        </CardHeader>
        <CardContent>
          <TimeLogTable entries={entries} onEdit={onEdit} onDelete={onDelete} />
          <div className="mt-4 flex justify-end">
            <Button onClick={onAddEntry}>
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

function ReportsView({ entries }: { entries: TimeEntryDTO[] }) {
  return <TimeChart entries={entries} />;
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
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntryDTO | null>(null);

  const timeEntriesQuery = useTimeEntriesQuery();
  const startTimerMutation = useStartTimerMutation();
  const stopTimerMutation = useStopTimerMutation();
  const createEntryMutation = useCreateTimeEntryMutation();
  const updateEntryMutation = useUpdateTimeEntryMutation();
  const deleteEntryMutation = useDeleteTimeEntryMutation();

  const runningEntry = useMemo(
    () => timeEntriesQuery.data?.find((entry) => entry.isRunning) ?? null,
    [timeEntriesQuery.data],
  );

  const weekEntries = useMemo(() => {
    if (!timeEntriesQuery.data) return [];
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    return timeEntriesQuery.data.filter(e => {
      const entryDate = parseISO(e.startedAt);
      return entryDate >= currentWeekStart && entryDate <= weekEnd;
    });
  }, [timeEntriesQuery.data, currentWeekStart]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const handleCreateEntry = (data: { description: string; startedAt: string; endedAt: string; project: string }) => {
    createEntryMutation.mutate({
      description: data.description,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
    });
    setShowEntryModal(false);
    setEditingEntry(null);
  };

  const handleUpdateEntry = (data: { description: string; startedAt: string; endedAt: string; project: string }) => {
    if (!editingEntry) return;
    updateEntryMutation.mutate({
      id: editingEntry.id,
      description: data.description,
      startedAt: data.startedAt,
      endedAt: data.endedAt,
    });
    setShowEntryModal(false);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      deleteEntryMutation.mutate(entryId);
      setShowEntryModal(false);
      setEditingEntry(null);
    }
  };

  const handleExport = () => {
    const headers = ["Date", "Description", "Start Time", "End Time", "Duration (hours)"];
    const rows = weekEntries.map(e => [
      format(parseISO(e.startedAt), "yyyy-MM-dd"),
      e.description || "",
      format(parseISO(e.startedAt), "HH:mm"),
      e.endedAt ? format(parseISO(e.endedAt), "HH:mm") : "",
      e.durationMinutes ? (e.durationMinutes / 60).toFixed(2) : "",
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `timesheet-${format(currentWeekStart, "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const totalHoursThisWeek = useMemo(() => {
    return (weekEntries.reduce((sum, e) => sum + (e.durationMinutes || 0), 0) / 60).toFixed(1);
  }, [weekEntries]);

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
      {view === "reports" ? <ReportsView entries={weekEntries} /> : null}

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
