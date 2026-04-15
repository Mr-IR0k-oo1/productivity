"use client";

import { useCallback, useMemo, useState } from "react";
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  CalendarDays,
  Clock3,
  Filter,
  GanttChartSquare,
  ListFilter,
  Plus,
  Search,
  SquareCheckBig,
  Table2,
} from "lucide-react";

import { KanbanBoard } from "@/components/features/KanbanBoard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUpdateTaskStatusMutation, type TaskDTO } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

type ViewMode = "kanban" | "list" | "calendar" | "gantt";
type TaskStatus = "todo" | "in_progress" | "review" | "done";
type TaskPriority = "High" | "Medium" | "Low";
type DueFilter = "all" | "mine" | "overdue" | "this-week";

type TaskRecord = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  initials: string;
  dueDate: string;
  priority: TaskPriority;
  labels: string[];
  status: TaskStatus;
  subtasksDone: number;
  subtasksTotal: number;
  comments: number;
  estimateHours: number;
  progress: number;
  recurring?: boolean;
  dependency?: string;
  startDate: string;
  endDate: string;
};

const referenceDate = new Date("2026-04-14T09:00:00");

const initialTasks: TaskRecord[] = [
  {
    id: "task-1",
    title: "Finalize onboarding checklist",
    description: "Polish the onboarding flow and align it with the latest product launch priorities.",
    assignee: "Arun",
    initials: "A",
    dueDate: "2026-04-13T17:00:00",
    priority: "High",
    labels: ["Launch", "Ops"],
    status: "todo",
    subtasksDone: 2,
    subtasksTotal: 5,
    comments: 3,
    estimateHours: 6,
    progress: 40,
    recurring: true,
    startDate: "2026-04-12T09:00:00",
    endDate: "2026-04-17T18:00:00",
  },
  {
    id: "task-2",
    title: "Ship realtime notifications",
    description: "Finish realtime notifications and validate the websocket update path.",
    assignee: "Bala",
    initials: "B",
    dueDate: "2026-04-15T12:00:00",
    priority: "Medium",
    labels: ["Platform", "Realtime"],
    status: "in_progress",
    subtasksDone: 3,
    subtasksTotal: 4,
    comments: 8,
    estimateHours: 9,
    progress: 75,
    dependency: "Depends on API review",
    startDate: "2026-04-13T09:00:00",
    endDate: "2026-04-18T18:00:00",
  },
  {
    id: "task-3",
    title: "Review investor deck",
    description: "Prepare the final review pass for the next investor update.",
    assignee: "Chitra",
    initials: "C",
    dueDate: "2026-04-16T10:30:00",
    priority: "Low",
    labels: ["Strategy"],
    status: "review",
    subtasksDone: 5,
    subtasksTotal: 6,
    comments: 4,
    estimateHours: 4,
    progress: 84,
    startDate: "2026-04-11T09:00:00",
    endDate: "2026-04-18T18:00:00",
  },
  {
    id: "task-4",
    title: "Update billing retry logic",
    description: "Fix retry handling and make sure the overdue invoice flow is safe.",
    assignee: "Dev",
    initials: "D",
    dueDate: "2026-04-10T14:00:00",
    priority: "High",
    labels: ["Billing", "Bug"],
    status: "done",
    subtasksDone: 6,
    subtasksTotal: 6,
    comments: 5,
    estimateHours: 7,
    progress: 100,
    startDate: "2026-04-08T09:00:00",
    endDate: "2026-04-12T18:00:00",
  },
  {
    id: "task-5",
    title: "Plan sprint retro",
    description: "Assemble talking points, owners, and action items for the weekly retro.",
    assignee: "Arun",
    initials: "A",
    dueDate: "2026-04-18T16:00:00",
    priority: "Medium",
    labels: ["Team"],
    status: "todo",
    subtasksDone: 1,
    subtasksTotal: 3,
    comments: 1,
    estimateHours: 2,
    progress: 33,
    recurring: true,
    startDate: "2026-04-16T09:00:00",
    endDate: "2026-04-21T18:00:00",
  },
  {
    id: "task-6",
    title: "Refine workspace filters",
    description: "Align filter chips, global search, and assignee state across task views.",
    assignee: "Bala",
    initials: "B",
    dueDate: "2026-04-14T19:00:00",
    priority: "High",
    labels: ["UX", "Filters"],
    status: "in_progress",
    subtasksDone: 4,
    subtasksTotal: 7,
    comments: 6,
    estimateHours: 8,
    progress: 57,
    dependency: "Blocked by task API update",
    startDate: "2026-04-14T09:00:00",
    endDate: "2026-04-20T18:00:00",
  },
  {
    id: "task-7",
    title: "Write release notes",
    description: "Summarize the latest product and engineering changes for the release.",
    assignee: "Chitra",
    initials: "C",
    dueDate: "2026-04-17T11:00:00",
    priority: "Low",
    labels: ["Docs"],
    status: "review",
    subtasksDone: 2,
    subtasksTotal: 3,
    comments: 2,
    estimateHours: 3,
    progress: 66,
    startDate: "2026-04-15T09:00:00",
    endDate: "2026-04-19T18:00:00",
  },
  {
    id: "task-8",
    title: "Validate calendar sync",
    description: "Check task due dates against the calendar experience and overdue highlighting.",
    assignee: "Dev",
    initials: "D",
    dueDate: "2026-04-14T23:00:00",
    priority: "Medium",
    labels: ["Calendar", "QA"],
    status: "todo",
    subtasksDone: 1,
    subtasksTotal: 4,
    comments: 0,
    estimateHours: 5,
    progress: 25,
    startDate: "2026-04-13T09:00:00",
    endDate: "2026-04-16T18:00:00",
  },
];

const assigneeOptions = ["All", "Arun", "Bala", "Chitra", "Dev"] as const;
const priorityOptions = ["All", "High", "Medium", "Low"] as const;

function formatDueDate(value: string) {
  const dueDate = parseISO(value);
  const overdue = dueDate < referenceDate && !isToday(dueDate);

  return {
    label: format(dueDate, "MMM d, h:mm a"),
    overdue,
  };
}

function getTaskWindow(task: TaskRecord) {
  return {
    start: parseISO(task.startDate),
    end: parseISO(task.endDate),
  };
}

function TaskStats() {
  const stats = [
    { title: "Open Tasks", value: "18", trend: "+3 this week" },
    { title: "Overdue", value: "2", trend: "Needs attention", positive: false },
    { title: "In Progress", value: "7", trend: "Balanced across owners" },
    { title: "Completed", value: "12", trend: "67% this sprint" },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">{stat.title}</p>
            <CardTitle className="text-3xl font-semibold text-zinc-100">{stat.value}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={cn("text-sm", stat.positive === false ? "text-rose-400" : "text-emerald-400")}>{stat.trend}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function TaskToolbar({
  viewMode,
  setViewMode,
  search,
  setSearch,
  priorityFilter,
  setPriorityFilter,
  assigneeFilter,
  setAssigneeFilter,
  dueFilter,
  setDueFilter,
  myTasksOnly,
  setMyTasksOnly,
  selectedCount,
  onOpenCreate,
}: {
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;
  search: string;
  setSearch: (value: string) => void;
  priorityFilter: string;
  setPriorityFilter: (value: string) => void;
  assigneeFilter: string;
  setAssigneeFilter: (value: string) => void;
  dueFilter: DueFilter;
  setDueFilter: (value: DueFilter) => void;
  myTasksOnly: boolean;
  setMyTasksOnly: (value: boolean) => void;
  selectedCount: number;
  onOpenCreate: () => void;
}) {
  return (
    <Card className="border-zinc-900 bg-zinc-950/60">
      <CardContent className="space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Tasks</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-100">Task workspace</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">
              Manage tasks across Kanban, list, calendar, and gantt views from one workspace.
            </p>
          </div>
          <Button onClick={onOpenCreate}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "kanban", label: "Kanban", icon: SquareCheckBig },
            { id: "list", label: "List", icon: Table2 },
            { id: "calendar", label: "Calendar", icon: CalendarDays },
            { id: "gantt", label: "Gantt", icon: GanttChartSquare },
          ].map((item) => {
            const Icon = item.icon;
            const active = viewMode === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setViewMode(item.id as ViewMode)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                  active
                    ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                    : "border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 md:min-w-[320px]">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, labels, assignees"
                className="pl-9"
              />
            </div>
            <Button variant="secondary">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,170px))]">
          <label className="flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={myTasksOnly}
              onChange={(event) => setMyTasksOnly(event.target.checked)}
            />
            My Tasks
          </label>
          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
          >
            {priorityOptions.map((option) => (
              <option key={option} value={option}>
                {option} Priority
              </option>
            ))}
          </select>
          <select
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
            className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
          >
            {assigneeOptions.map((option) => (
              <option key={option} value={option}>
                {option === "All" ? "All Assignees" : option}
              </option>
            ))}
          </select>
          <select
            value={dueFilter}
            onChange={(event) => setDueFilter(event.target.value as DueFilter)}
            className="h-10 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
          >
            <option value="all">All Due Dates</option>
            <option value="mine">My Tasks</option>
            <option value="this-week">Due This Week</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {selectedCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-900 bg-zinc-950/80 px-3 py-2">
            <p className="text-sm text-zinc-300">
              {selectedCount} task{selectedCount === 1 ? "" : "s"} selected
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">
                Bulk Status
              </Button>
              <Button variant="secondary" size="sm">
                Assign
              </Button>
              <Button variant="secondary" size="sm" className="border-red-900 text-red-200">
                Delete
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TaskDetailPanel({
  task,
  onClose,
}: {
  task: TaskRecord | null;
  onClose: () => void;
}) {
  if (!task) return null;

  const due = formatDueDate(task.dueDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-900 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={task.priority === "High" ? "warning" : task.priority === "Low" ? "default" : "success"}>
                {task.priority}
              </Badge>
              <Badge variant="default">{task.status.replace("_", " ")}</Badge>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-100">{task.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{task.description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Card className="border-zinc-900 bg-zinc-950/60">
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Assignee</p>
                  <p className="text-sm text-zinc-200">{task.assignee}</p>
                  <p className="text-xs text-zinc-500">Due {due.label}</p>
                </CardContent>
              </Card>
              <Card className="border-zinc-900 bg-zinc-950/60">
                <CardContent className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Progress</p>
                  <p className="text-sm text-zinc-200">{task.subtasksDone}/{task.subtasksTotal} subtasks</p>
                  <div className="h-2 rounded-full bg-zinc-900">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${task.progress}%` }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-200">Subtasks</p>
                  <Badge variant="default">{task.subtasksDone}/{task.subtasksTotal}</Badge>
                </div>
                <div className="space-y-2 text-sm text-zinc-400">
                  {Array.from({ length: task.subtasksTotal }).map((_, index) => (
                    <label key={index} className="flex items-center gap-2 rounded-md border border-zinc-900 px-3 py-2">
                      <input type="checkbox" defaultChecked={index < task.subtasksDone} />
                      Subtask {index + 1}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium text-zinc-200">Comments + Activity</p>
                <div className="space-y-2 text-sm text-zinc-400">
                  <p>Arun: Needs review on the dependency blocker.</p>
                  <p>Bala: Updated the filter logic and rechecked the due date state.</p>
                  <p>Dev: Waiting on the API update before final handoff.</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="secondary">
                  <Clock3 className="h-4 w-4" />
                  Start timer
                </Button>
                <Button className="w-full justify-start" variant="secondary">
                  <ListFilter className="h-4 w-4" />
                  Convert to milestone
                </Button>
                <Button className="w-full justify-start" variant="secondary">
                  <Filter className="h-4 w-4" />
                  Add dependency
                </Button>
              </CardContent>
            </Card>

            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Estimate</span>
                  <span className="text-zinc-100">{task.estimateHours}h</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Due</span>
                  <span className={cn(due.overdue ? "text-rose-400" : "text-zinc-100")}>{due.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Recurring</span>
                  <span className="text-zinc-100">{task.recurring ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dependency</span>
                  <span className="text-zinc-100">{task.dependency ?? "None"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskCreateModal({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-900 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Create</p>
            <h2 className="mt-1 text-2xl font-semibold text-zinc-100">New task</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <Input placeholder="Task title" />
          <Input placeholder="Assignee" />
          <Input placeholder="Due date" />
          <Input placeholder="Priority" />
          <Input placeholder="Labels" />
          <Input placeholder="Estimated time" />
          <textarea
            className="min-h-[120px] rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-600 md:col-span-2"
            placeholder="Description"
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-900 p-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button>Create Task</Button>
        </div>
      </div>
    </div>
  );
}

function ListView({
  tasks,
  selectedTaskIds,
  onToggleSelect,
  onOpenTask,
}: {
  tasks: TaskRecord[];
  selectedTaskIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenTask: (task: TaskRecord) => void;
}) {
  return (
    <Card className="border-zinc-900 bg-zinc-950/60">
      <CardHeader className="border-b border-zinc-900 pb-4">
        <CardTitle className="text-xl">List view</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-zinc-950/70 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Select</th>
              <th className="px-4 py-3">Task Title</th>
              <th className="px-4 py-3">Assignee</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const due = formatDueDate(task.dueDate);

              return (
                <tr key={task.id} className="border-t border-zinc-900 text-zinc-200">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => onToggleSelect(task.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => onOpenTask(task)} className="text-left hover:text-zinc-100">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-zinc-500">{task.labels.join(" · ")}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback>{task.initials}</AvatarFallback>
                      </Avatar>
                      {task.assignee}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={task.priority === "High" ? "warning" : task.priority === "Low" ? "default" : "success"}>
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(due.overdue ? "text-rose-400" : "text-zinc-200")}>{due.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{task.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 rounded-full bg-zinc-900">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${task.progress}%` }} />
                      </div>
                      <span className="text-xs text-zinc-500">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => onOpenTask(task)}>
                        View
                      </Button>
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function CalendarView({ tasks, onOpenTask }: { tasks: TaskRecord[]; onOpenTask: (task: TaskRecord) => void }) {
  const monthDate = referenceDate;
  const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days: Date[] = [];

  for (let current = start; current <= end; current = addDays(current, 1)) {
    days.push(current);
  }

  return (
    <Card className="border-zinc-900 bg-zinc-950/60">
      <CardHeader className="border-b border-zinc-900 pb-4">
        <CardTitle className="text-xl">Calendar view</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-wide text-zinc-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-2 pb-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const dayTasks = tasks.filter((task) => isSameDay(parseISO(task.dueDate), day));

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] rounded-xl border p-3 text-left transition-colors",
                  isSameMonth(day, monthDate) ? "border-zinc-900 bg-zinc-950/40 hover:border-zinc-700" : "border-zinc-950 bg-zinc-950/20 opacity-45",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("flex h-7 w-7 items-center justify-center rounded-full text-sm", isToday(day) ? "bg-zinc-100 text-zinc-900" : "text-zinc-200")}>
                    {format(day, "d")}
                  </span>
                  {dayTasks.length > 0 ? <span className="text-xs text-zinc-500">{dayTasks.length} tasks</span> : null}
                </div>
                <div className="mt-3 space-y-2">
                  {dayTasks.slice(0, 3).map((task) => {
                    const due = formatDueDate(task.dueDate);
                    return (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onOpenTask(task)}
                        className={cn(
                          "w-full rounded-md border px-2 py-1.5 text-left text-xs transition-colors",
                          due.overdue ? "border-rose-900 bg-rose-950/50 text-rose-200" : "border-zinc-800 bg-zinc-900 text-zinc-100",
                        )}
                      >
                        {task.title}
                      </button>
                    );
                  })}
                  {dayTasks.length > 3 ? <p className="text-xs text-zinc-500">+{dayTasks.length - 3} more</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function GanttView({ tasks, onOpenTask }: { tasks: TaskRecord[]; onOpenTask: (task: TaskRecord) => void }) {
  const windows = tasks.map((task) => {
    const { start, end } = getTaskWindow(task);
    return { task, start, end };
  });
  const minStart = windows.reduce((min, item) => (item.start < min ? item.start : min), windows[0]?.start ?? referenceDate);
  const maxEnd = windows.reduce((max, item) => (item.end > max ? item.end : max), windows[0]?.end ?? referenceDate);
  const totalDays = Math.max(1, differenceInCalendarDays(maxEnd, minStart) + 1);

  return (
    <Card className="border-zinc-900 bg-zinc-950/60">
      <CardHeader className="border-b border-zinc-900 pb-4">
        <CardTitle className="text-xl">Gantt view</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 md:p-6">
        <div className="grid grid-cols-[220px_minmax(0,1fr)] gap-4 text-xs uppercase tracking-wide text-zinc-500">
          <div>Task</div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, index) => addDays(minStart, index)).map((day) => (
              <div key={day.toISOString()} className="text-center">
                {format(day, "MMM d")}
              </div>
            ))}
          </div>
        </div>

        {windows.map(({ task, start, end }) => {
          const left = Math.max(0, differenceInCalendarDays(start, minStart));
          const width = Math.max(1, differenceInCalendarDays(end, start) + 1);
          const due = formatDueDate(task.dueDate);

          return (
            <div key={task.id} className="grid grid-cols-[220px_minmax(0,1fr)] items-center gap-4 rounded-xl border border-zinc-900 bg-zinc-950/40 p-3">
              <button type="button" onClick={() => onOpenTask(task)} className="text-left">
                <p className="text-sm font-medium text-zinc-100">{task.title}</p>
                <p className="text-xs text-zinc-500">{task.assignee} · {task.priority} · {due.label}</p>
              </button>
              <div className="relative h-10 rounded-lg border border-zinc-900 bg-zinc-950/50">
                <div
                  className={cn(
                    "absolute top-1.5 h-7 rounded-md",
                    task.status === "done"
                      ? "bg-emerald-500/70"
                      : task.status === "review"
                        ? "bg-blue-500/70"
                        : task.priority === "High"
                          ? "bg-rose-500/70"
                          : "bg-zinc-400/70",
                  )}
                  style={{ left: `${(left / totalDays) * 100}%`, width: `${(width / totalDays) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function TaskWorkspace() {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("All");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");
  const [myTasksOnly, setMyTasksOnly] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        search.trim().length === 0 ||
        [task.title, task.description, task.assignee, ...task.labels].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        );
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      const matchesAssignee = assigneeFilter === "All" || task.assignee === assigneeFilter;
      const dueDate = parseISO(task.dueDate);
      const matchesDue =
        dueFilter === "all"
          ? true
          : dueFilter === "mine"
            ? task.assignee === "Arun"
            : dueFilter === "overdue"
              ? dueDate < referenceDate
              : isWithinInterval(dueDate, {
                  start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
                  end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
                });
      const matchesMyTasks = !myTasksOnly || task.assignee === "Arun";

      return matchesSearch && matchesPriority && matchesAssignee && matchesDue && matchesMyTasks;
    });
  }, [assigneeFilter, dueFilter, myTasksOnly, priorityFilter, search, tasks]);

  const selectedCount = selectedTaskIds.length;

  const selectedTasks = useMemo(
    () => filteredTasks.filter((task) => selectedTaskIds.includes(task.id)),
    [filteredTasks, selectedTaskIds],
  );

  const visibleTaskIds = useMemo(() => filteredTasks.map((task) => task.id), [filteredTasks]);

  function moveTask(taskId: string, status: TaskStatus) {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, status, progress: status === "done" ? 100 : task.progress } : task)),
    );
  }

  function toggleSelection(taskId: string) {
    setSelectedTaskIds((current) =>
      current.includes(taskId) ? current.filter((value) => value !== taskId) : [...current, taskId],
    );
  }

  function openTask(task: TaskRecord) {
    setSelectedTask(task);
  }

  function closeTask() {
    setSelectedTask(null);
  }

  function renderView() {
    if (viewMode === "kanban") {
      return (
        <KanbanBoard
          tasks={filteredTasks}
          selectedTaskIds={selectedTaskIds}
          activeTaskId={activeTaskId}
          onTaskOpen={openTask}
          onTaskSelect={toggleSelection}
          onStatusChange={moveTask}
          onDragStart={setActiveTaskId}
          onDragEnd={() => setActiveTaskId(null)}
        />
      );
    }

    if (viewMode === "list") {
      return <ListView tasks={filteredTasks} selectedTaskIds={new Set(selectedTaskIds)} onToggleSelect={toggleSelection} onOpenTask={openTask} />;
    }

    if (viewMode === "calendar") {
      return <CalendarView tasks={filteredTasks} onOpenTask={openTask} />;
    }

    return <GanttView tasks={filteredTasks} onOpenTask={openTask} />;
  }

  return (
    <div className="space-y-6 page-animate">
      <TaskToolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        search={search}
        setSearch={setSearch}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        setAssigneeFilter={setAssigneeFilter}
        dueFilter={dueFilter}
        setDueFilter={setDueFilter}
        myTasksOnly={myTasksOnly}
        setMyTasksOnly={setMyTasksOnly}
        selectedCount={selectedCount}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      <TaskStats />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {renderView()}

          <Card className="border-zinc-900 bg-zinc-950/50">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-6">
              <div>
                <p className="text-sm font-medium text-zinc-100">Active filters</p>
                <p className="text-sm text-zinc-500">
                  {visibleTaskIds.length} visible tasks · {selectedTasks.length} selected task{selectedTasks.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">{viewMode}</Badge>
                <Badge variant="default">{priorityFilter} priority</Badge>
                <Badge variant="default">{assigneeFilter}</Badge>
                <Badge variant="default">{dueFilter.replace("-", " ")}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center justify-between">
                <span>Overdue</span>
                <span className="text-rose-400">{tasks.filter((task) => parseISO(task.dueDate) < referenceDate).length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Due this week</span>
                <span className="text-zinc-100">
                  {tasks.filter((task) =>
                    isWithinInterval(parseISO(task.dueDate), {
                      start: startOfWeek(referenceDate, { weekStartsOn: 1 }),
                      end: endOfWeek(referenceDate, { weekStartsOn: 1 }),
                    }),
                  ).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Recurring</span>
                <span className="text-zinc-100">{tasks.filter((task) => task.recurring).length}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {assigneeOptions.filter((value) => value !== "All").map((assignee) => (
                <div key={assignee} className="flex items-center gap-3 rounded-lg border border-zinc-900 bg-zinc-950/50 p-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{assignee.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-200">{assignee}</p>
                    <p className="text-xs text-zinc-500">Active in current sprint</p>
                  </div>
                  <Badge variant="success">Available</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Milestones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-400">
              {tasks
                .filter((task) => !isAfter(parseISO(task.dueDate), addDays(referenceDate, 7)))
                .slice(0, 4)
                .map((task) => {
                  const due = formatDueDate(task.dueDate);

                  return (
                    <div key={task.id} className="flex items-center justify-between rounded-md border border-zinc-900 bg-zinc-950/50 px-3 py-2.5">
                      <div>
                        <p className="text-sm text-zinc-200">{task.title}</p>
                        <p className="text-xs text-zinc-500">{task.assignee}</p>
                      </div>
                      <span className={cn("text-xs", due.overdue ? "text-rose-400" : "text-zinc-400")}>{due.label}</span>
                    </div>
                  );
                })}
            </CardContent>
          </Card>
        </aside>
      </div>

      {selectedTask ? <TaskDetailPanel task={selectedTask} onClose={closeTask} /> : null}
      {isCreateOpen ? <TaskCreateModal onClose={() => setIsCreateOpen(false)} /> : null}
    </div>
  );
}
