"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Clock3, PauseCircle, PlayCircle, Sparkles } from "lucide-react";

import type { FlowDemoVariant } from "@/components/flow/flow-content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InteractiveDemoProps = {
  variant: FlowDemoVariant;
};

type IdeaDemoItem = {
  id: string;
  title: string;
  votes: number;
  converted: boolean;
  tag: string;
};

type TaskDemoItem = {
  id: string;
  title: string;
  status: "backlog" | "active" | "done";
  dependency?: string;
};

type TaskColumn = TaskDemoItem["status"];

const ideaSeed: IdeaDemoItem[] = [
  { id: "idea-1", title: "AI standup summary", votes: 11, converted: false, tag: "Automation" },
  { id: "idea-2", title: "Focus debt heatmap", votes: 8, converted: false, tag: "Insights" },
  { id: "idea-3", title: "Client handoff checklist", votes: 5, converted: false, tag: "Templates" },
];

const taskSeed: TaskDemoItem[] = [
  { id: "task-1", title: "Shape task brief", status: "backlog" },
  { id: "task-2", title: "Design kanban states", status: "active", dependency: "Needs scope signoff" },
  { id: "task-3", title: "Ship task filters", status: "done" },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const timeTasks = ["Dashboard v2", "Client onboarding", "Calendar sync"] as const;

const resultRanges = {
  week: {
    stats: [
      { label: "Tasks done", value: "38" },
      { label: "Tracked hours", value: "47h" },
      { label: "On-time rate", value: "91%" },
    ],
    bars: [
      { label: "Product", value: 78 },
      { label: "Ops", value: 55 },
      { label: "Growth", value: 68 },
    ],
    leaderboard: [
      { name: "Alice", metric: "92%" },
      { name: "Bala", metric: "88%" },
      { name: "Chitra", metric: "84%" },
    ],
  },
  sprint: {
    stats: [
      { label: "Tasks done", value: "142" },
      { label: "Tracked hours", value: "187h" },
      { label: "On-time rate", value: "87%" },
    ],
    bars: [
      { label: "Product", value: 84 },
      { label: "Ops", value: 63 },
      { label: "Growth", value: 74 },
    ],
    leaderboard: [
      { name: "Alice", metric: "94%" },
      { name: "Dev", metric: "89%" },
      { name: "Bala", metric: "86%" },
    ],
  },
} as const;

function DemoShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-[linear-gradient(180deg,rgba(18,18,18,0.96),rgba(10,10,10,0.96))] p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">Interactive Demo</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">{description}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-xs font-medium text-zinc-300">
          <Sparkles className="h-4 w-4 text-sky-300" />
          Lightweight public preview
        </div>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function IdeasDemo() {
  const [ideas, setIdeas] = useState(ideaSeed);

  const topIdea = useMemo(
    () => [...ideas].sort((left, right) => right.votes - left.votes)[0],
    [ideas],
  );

  const convertedIdeas = ideas.filter((idea) => idea.converted);

  const handleVote = (id: string) => {
    setIdeas((current) =>
      current.map((idea) => (idea.id === id ? { ...idea, votes: idea.votes + 1 } : idea)),
    );
  };

  const handleConvert = () => {
    if (!topIdea) {
      return;
    }

    setIdeas((current) =>
      current.map((idea) => (idea.id === topIdea.id ? { ...idea, converted: true } : idea)),
    );
  };

  return (
    <DemoShell
      title="Vote on the right idea, then promote it forward"
      description="This preview simulates the early product motion: collect candidate ideas, add team signal, and convert the strongest one into execution."
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {ideas.map((idea) => (
            <div key={idea.id} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex rounded-full border border-zinc-800 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-zinc-400">
                    {idea.tag}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-white">{idea.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleVote(idea.id)}
                  className="rounded-full border border-zinc-700 px-3 py-1.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
                >
                  + Vote ({idea.votes})
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span>Comments: 4</span>
                <span>Signal: high</span>
                {idea.converted ? <span className="text-emerald-300">Converted to task</span> : null}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Promotion Queue</p>
          <h3 className="mt-3 text-xl font-semibold text-white">Best next move</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Promote the highest-signal idea into tasks when the team is ready to execute.
          </p>
          <div className="mt-6 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm text-zinc-500">Top idea</div>
            <div className="mt-2 text-lg font-semibold text-white">{topIdea?.title}</div>
            <div className="mt-1 text-sm text-zinc-400">{topIdea?.votes ?? 0} votes</div>
          </div>
          <Button
            type="button"
            onClick={handleConvert}
            className="mt-6 h-11 w-full rounded-2xl bg-zinc-100 text-zinc-950 hover:bg-white"
          >
            Convert top idea into task
          </Button>
          <div className="mt-6 space-y-3">
            <div className="text-sm font-medium text-zinc-200">Created tasks</div>
            {convertedIdeas.length > 0 ? (
              convertedIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm">
                  <span className="text-zinc-200">{idea.title}</span>
                  <span className="text-zinc-500">Ready for task board</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 px-4 py-6 text-sm text-zinc-500">
                Promote an idea to see it land in the execution queue.
              </div>
            )}
          </div>
        </div>
      </div>
    </DemoShell>
  );
}

function TasksDemo() {
  const [tasks, setTasks] = useState(taskSeed);
  const [selectedTaskId, setSelectedTaskId] = useState(taskSeed[0].id);
  const [showDependencies, setShowDependencies] = useState(true);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];

  const advanceSelectedTask = () => {
    if (!selectedTask) {
      return;
    }

    const nextStatus: Record<TaskColumn, TaskColumn> = {
      backlog: "active",
      active: "done",
      done: "backlog",
    };

    setTasks((current) =>
      current.map((task) =>
        task.id === selectedTask.id ? { ...task, status: nextStatus[task.status] } : task,
      ),
    );
  };

  const columns: Array<{ key: TaskColumn; label: string }> = [
    { key: "backlog", label: "Backlog" },
    { key: "active", label: "In Progress" },
    { key: "done", label: "Done" },
  ];

  return (
    <DemoShell
      title="Move work through the board with dependencies in view"
      description="This preview shows the core execution loop: select a task, move it forward, and keep blockers visible while the team works."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="grid gap-4 lg:grid-cols-3">
          {columns.map((column) => (
            <div key={column.key} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">{column.label}</h3>
                <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-500">
                  {tasks.filter((task) => task.status === column.key).length}
                </span>
              </div>
              <div className="space-y-3">
                {tasks
                  .filter((task) => task.status === column.key)
                  .map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => setSelectedTaskId(task.id)}
                      className={cn(
                        "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                        task.id === selectedTaskId
                          ? "border-sky-400/50 bg-sky-500/10"
                          : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700",
                      )}
                    >
                      <div className="text-sm font-medium text-zinc-100">{task.title}</div>
                      {showDependencies && task.dependency ? (
                        <div className="mt-3 text-xs text-amber-300">Dependency: {task.dependency}</div>
                      ) : (
                        <div className="mt-3 text-xs text-zinc-500">Ready for next step</div>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Selected Task</p>
          <h3 className="mt-3 text-xl font-semibold text-white">{selectedTask?.title}</h3>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Cycle the selected task through the board to simulate how execution moves from backlog to active work to completion.
          </p>
          <div className="mt-6 space-y-3 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm text-zinc-500">Current column</div>
            <div className="text-lg font-semibold capitalize text-white">{selectedTask?.status.replace("_", " ")}</div>
            <div className="text-sm text-zinc-400">{selectedTask?.dependency ?? "No blocker on this item."}</div>
          </div>
          <Button
            type="button"
            onClick={advanceSelectedTask}
            className="mt-6 h-11 w-full rounded-2xl bg-sky-500 text-white hover:bg-sky-400"
          >
            Advance selected task
          </Button>
          <button
            type="button"
            onClick={() => setShowDependencies((current) => !current)}
            className="mt-3 w-full rounded-2xl border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white"
          >
            {showDependencies ? "Hide dependency notes" : "Show dependency notes"}
          </button>
        </div>
      </div>
    </DemoShell>
  );
}

function CalendarDemo() {
  const [selectedTask, setSelectedTask] = useState<"Design review" | "Focus block" | "Launch checklist">("Design review");
  const [assignments, setAssignments] = useState<Record<(typeof weekDays)[number], string | null>>({
    Mon: "Sprint planning",
    Tue: null,
    Wed: "Prototype feedback",
    Thu: null,
    Fri: "Launch recap",
  });

  const assignTask = (day: (typeof weekDays)[number]) => {
    setAssignments((current) => ({
      ...current,
      [day]: current[day] === selectedTask ? null : selectedTask,
    }));
  };

  const capacity = [
    { name: "Alice", status: "Focus time", tone: "text-emerald-300" },
    { name: "Bala", status: "Open slot", tone: "text-sky-300" },
    { name: "Chitra", status: "Review block", tone: "text-fuchsia-300" },
  ];

  return (
    <DemoShell
      title="Schedule real work into the week"
      description="Pick a task and place it into the calendar to simulate how teams convert backlog intent into an actual weekly plan."
    >
      <div className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Unscheduled work</p>
          <div className="mt-4 space-y-3">
            {(["Design review", "Focus block", "Launch checklist"] as const).map((task) => (
              <button
                key={task}
                type="button"
                onClick={() => setSelectedTask(task)}
                className={cn(
                  "w-full rounded-2xl border px-4 py-4 text-left transition-colors",
                  task === selectedTask
                    ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700",
                )}
              >
                <div className="text-sm font-medium text-zinc-100">{task}</div>
                <div className="mt-2 text-xs text-zinc-500">Click a weekday to place this work on the plan.</div>
              </button>
            ))}
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm font-medium text-zinc-200">Team availability</div>
            <div className="mt-3 space-y-2">
              {capacity.map((member) => (
                <div key={member.name} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-300">{member.name}</span>
                  <span className={member.tone}>{member.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {weekDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => assignTask(day)}
              className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-4 text-left transition-colors hover:border-fuchsia-400/40"
            >
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">{day}</div>
              <div className="mt-6 min-h-28 rounded-[1.25rem] border border-dashed border-zinc-800 bg-zinc-900/50 p-3">
                <div className="text-xs text-zinc-500">Scheduled</div>
                <div className="mt-3 text-sm font-medium text-zinc-100">{assignments[day] ?? "Open slot"}</div>
                <div className="mt-3 text-xs text-zinc-500">Click to place or clear the selected task.</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </DemoShell>
  );
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function TimeDemo() {
  const [activeTask, setActiveTask] = useState<(typeof timeTasks)[number]>("Dashboard v2");
  const [running, setRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(17 * 60 + 24);
  const [entries, setEntries] = useState([
    { id: "entry-1", task: "Sprint planning", duration: "00:42", state: "Approved" },
    { id: "entry-2", task: "Client onboarding", duration: "01:18", state: "Pending" },
  ]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  const handleStop = () => {
    setRunning(false);
    setEntries((current) => [
      {
        id: `entry-${current.length + 1}`,
        task: activeTask,
        duration: formatSeconds(elapsedSeconds),
        state: "Pending",
      },
      ...current,
    ]);
    setElapsedSeconds(0);
  };

  return (
    <DemoShell
      title="Run a timer, then review the time log"
      description="Time tracking stays lightweight here: choose the work, start the timer, and stop to capture a log entry ready for review."
    >
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Timer</p>
          <div className="mt-5 text-5xl font-semibold tracking-tight text-white">{formatSeconds(elapsedSeconds)}</div>
          <div className="mt-6 flex flex-wrap gap-2">
            {timeTasks.map((task) => (
              <button
                key={task}
                type="button"
                onClick={() => setActiveTask(task)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm transition-colors",
                  activeTask === task
                    ? "border-emerald-400/50 bg-emerald-500/10 text-emerald-200"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700",
                )}
              >
                {task}
              </button>
            ))}
          </div>
          <div className="mt-6 flex gap-3">
            <Button
              type="button"
              onClick={() => setRunning(true)}
              disabled={running}
              className="h-11 flex-1 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-400"
            >
              <PlayCircle className="h-4 w-4" />
              Start
            </Button>
            <button
              type="button"
              onClick={handleStop}
              disabled={!running}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-zinc-700 px-4 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:pointer-events-none disabled:opacity-50"
            >
              <PauseCircle className="h-4 w-4" />
              Stop
            </button>
          </div>
          <div className="mt-6 rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm text-zinc-500">Active task</div>
            <div className="mt-2 text-lg font-semibold text-white">{activeTask}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-zinc-400">
              <Clock3 className="h-4 w-4" />
              {running ? "Timer is running" : "Ready to track more work"}
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Recent entries</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Timesheet preview</h3>
            </div>
            <div className="rounded-full border border-zinc-800 px-3 py-2 text-xs text-zinc-400">Week view</div>
          </div>
          <div className="mt-5 space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-4">
                <div>
                  <div className="text-sm font-medium text-zinc-100">{entry.task}</div>
                  <div className="mt-1 text-xs text-zinc-500">Submitted for review</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-white">{entry.duration}</div>
                  <div className={cn("mt-1 text-xs", entry.state === "Approved" ? "text-emerald-300" : "text-amber-300")}>
                    {entry.state}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DemoShell>
  );
}

function ResultsDemo() {
  const [range, setRange] = useState<keyof typeof resultRanges>("week");
  const activeRange = resultRanges[range];

  return (
    <DemoShell
      title="Read performance patterns without leaving the product"
      description="Switch between time windows to preview how reporting changes the story around delivery, hours, and team momentum."
    >
      <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Reporting window</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Team results snapshot</h3>
          </div>
          <div className="inline-flex rounded-full border border-zinc-800 bg-zinc-900/60 p-1">
            {(["week", "sprint"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  range === option ? "bg-violet-500 text-white" : "text-zinc-400 hover:text-white",
                )}
              >
                {option === "week" ? "This week" : "This sprint"}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {activeRange.stats.map((stat) => (
            <div key={stat.label} className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="text-sm text-zinc-500">{stat.label}</div>
              <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{stat.value}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm font-medium text-zinc-200">Delivery by team</div>
            <div className="mt-5 space-y-4">
              {activeRange.bars.map((bar) => (
                <div key={bar.label}>
                  <div className="flex items-center justify-between text-sm text-zinc-400">
                    <span>{bar.label}</span>
                    <span>{bar.value}%</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-zinc-800">
                    <div
                      className="h-3 rounded-full bg-violet-500"
                      style={{ width: `${bar.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="text-sm font-medium text-zinc-200">Leaderboard</div>
            <div className="mt-5 space-y-3">
              {activeRange.leaderboard.map((member, index) => (
                <div key={member.name} className="flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-300">
                      {index + 1}
                    </span>
                    <span className="text-zinc-100">{member.name}</span>
                  </div>
                  <span className="text-violet-300">{member.metric}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DemoShell>
  );
}

export function InteractiveDemo({ variant }: InteractiveDemoProps) {
  switch (variant) {
    case "ideas":
      return <IdeasDemo />;
    case "tasks":
      return <TasksDemo />;
    case "calendar":
      return <CalendarDemo />;
    case "time":
      return <TimeDemo />;
    case "results":
      return <ResultsDemo />;
    default:
      return null;
  }
}
