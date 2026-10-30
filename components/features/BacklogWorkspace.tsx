"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format } from "date-fns";
import { Bookmark, Bug, CheckSquare, Layers, Plus, Trash2, Zap } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type SprintDTO,
  useBurndownQuery,
  useSprintMutation,
  useSprintsQuery,
  useVelocityQuery,
} from "@/hooks/useSprints";
import {
  type IssueType,
  type TaskDTO,
  useCreateTaskMutation,
  useTasksQuery,
  useUpdateTaskMutation,
} from "@/hooks/useTasks";
import { cn } from "@/lib/utils";

export const issueTypeMeta: Record<IssueType, { label: string; icon: typeof Bug; className: string }> = {
  epic: { label: "Epic", icon: Zap, className: "text-violet-400" },
  story: { label: "Story", icon: Bookmark, className: "text-emerald-400" },
  task: { label: "Task", icon: CheckSquare, className: "text-sky-400" },
  bug: { label: "Bug", icon: Bug, className: "text-red-400" },
};

const statusLabel: Record<TaskDTO["status"], string> = {
  todo: "To do",
  in_progress: "In progress",
  review: "In review",
  done: "Done",
};

const selectClass =
  "h-8 rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2 text-xs text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]";

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong";
}

function formatRange(sprint: SprintDTO) {
  if (!sprint.startDate || !sprint.endDate) {
    return "Not started";
  }

  return `${format(new Date(sprint.startDate), "MMM d")} – ${format(new Date(sprint.endDate), "MMM d")}`;
}

export function IssueTypeIcon({ type, className }: { type: IssueType | undefined; className?: string }) {
  const meta = issueTypeMeta[type ?? "task"];
  const Icon = meta.icon;
  return <Icon aria-label={meta.label} className={cn("h-4 w-4 shrink-0", meta.className, className)} />;
}

type IssueRowProps = {
  issue: TaskDTO;
  epicTitle: string | null;
  plannedOrActiveSprints: SprintDTO[];
};

function IssueRow({ issue, epicTitle, plannedOrActiveSprints }: IssueRowProps) {
  const updateTask = useUpdateTaskMutation();
  const [points, setPoints] = useState(issue.storyPoints?.toString() ?? "");

  const save = (patch: Parameters<typeof updateTask.mutate>[0]) =>
    updateTask.mutate(patch, { onError: (error) => toast.error(errorMessage(error)) });

  const commitPoints = () => {
    const next = points.trim() === "" ? null : Number(points);

    if (next !== null && (!Number.isInteger(next) || next < 0 || next > 100)) {
      toast.error("Story points must be a whole number from 0 to 100");
      setPoints(issue.storyPoints?.toString() ?? "");
      return;
    }

    if (next !== (issue.storyPoints ?? null)) {
      save({ id: issue.id, storyPoints: next });
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--color-surface-hover)] sm:flex-nowrap">
      <IssueTypeIcon type={issue.issueType} />
      <span className="w-16 shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">{issue.key ?? "—"}</span>
      <Link
        href={`/tasks?taskId=${encodeURIComponent(issue.id)}`}
        className={cn(
          "min-w-0 flex-1 truncate text-sm text-[var(--color-text-primary)] hover:underline",
          issue.status === "done" && "text-[var(--color-text-tertiary)] line-through",
        )}
      >
        {issue.title}
      </Link>
      {epicTitle ? (
        <span className="hidden max-w-40 truncate rounded bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-400 md:inline">
          {epicTitle}
        </span>
      ) : null}
      <span className="hidden w-20 shrink-0 text-xs text-[var(--color-text-secondary)] sm:inline">{statusLabel[issue.status]}</span>
      <label className="sr-only" htmlFor={`points-${issue.id}`}>
        Story points for {issue.key ?? issue.title}
      </label>
      <input
        id={`points-${issue.id}`}
        inputMode="numeric"
        placeholder="–"
        value={points}
        onChange={(event) => setPoints(event.target.value)}
        onBlur={commitPoints}
        onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
        className="h-7 w-10 shrink-0 rounded-full bg-[var(--color-surface-hover)] text-center text-xs text-[var(--color-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
      />
      <label className="sr-only" htmlFor={`sprint-${issue.id}`}>
        Move {issue.key ?? issue.title}
      </label>
      <select
        id={`sprint-${issue.id}`}
        className={cn(selectClass, "w-32 shrink-0")}
        value={issue.sprintId ?? ""}
        onChange={(event) => save({ id: issue.id, sprintId: event.target.value || null })}
      >
        <option value="">Backlog</option>
        {plannedOrActiveSprints.map((sprint) => (
          <option key={sprint.id} value={sprint.id}>
            {sprint.name}
          </option>
        ))}
      </select>
    </li>
  );
}

function IssueList({
  issues,
  epicsById,
  plannedOrActiveSprints,
  emptyText,
}: {
  issues: TaskDTO[];
  epicsById: Map<string, string>;
  plannedOrActiveSprints: SprintDTO[];
  emptyText: string;
}) {
  if (issues.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-[var(--color-text-tertiary)]">{emptyText}</p>;
  }

  return (
    <ul className="divide-y divide-[var(--color-border-secondary)]">
      {issues.map((issue) => (
        <IssueRow
          key={issue.id}
          issue={issue}
          epicTitle={issue.parentId ? epicsById.get(issue.parentId) ?? null : null}
          plannedOrActiveSprints={plannedOrActiveSprints}
        />
      ))}
    </ul>
  );
}

function BurndownChart({ sprintId }: { sprintId: string }) {
  const burndown = useBurndownQuery(sprintId);
  const data = burndown.data ?? [];

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="h-48 px-2 pb-3" aria-label="Sprint burndown chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--color-border-secondary)" vertical={false} />
          <XAxis dataKey="date" tickFormatter={(value: string) => format(new Date(value), "MMM d")} tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
          <Tooltip contentStyle={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="linear" dataKey="ideal" name="Ideal" stroke="var(--color-text-tertiary)" strokeDasharray="4 4" dot={false} isAnimationActive={false} />
          <Line type="stepAfter" dataKey="remaining" name="Remaining" stroke="var(--color-accent)" strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function VelocityCard() {
  const velocity = useVelocityQuery();
  const data = velocity.data;

  if (!data || data.sprints.length === 0) {
    return null;
  }

  return (
    <section className="orbit-card overflow-hidden">
      <header className="flex items-baseline justify-between px-4 pt-4">
        <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Velocity</h2>
        <p className="text-xs text-[var(--color-text-secondary)]">Average {data.average} points per sprint</p>
      </header>
      <div className="h-52 px-2 py-3" aria-label="Velocity chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.sprints} margin={{ top: 8, right: 16, bottom: 0, left: -16 }} barGap={2}>
            <CartesianGrid stroke="var(--color-border-secondary)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-text-tertiary)" }} />
            <Tooltip contentStyle={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="committed" name="Committed" fill="var(--color-border-tertiary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            <Bar dataKey="completed" name="Completed" fill="var(--color-accent)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function StartSprintDialog({ sprint, onClose }: { sprint: SprintDTO | null; onClose: () => void }) {
  const sprintMutation = useSprintMutation();
  const today = format(new Date(), "yyyy-MM-dd");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 14), "yyyy-MM-dd"));
  const [goal, setGoal] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!sprint) return;

    if (endDate <= startDate) {
      toast.error("End date must be after the start date");
      return;
    }

    try {
      if (goal.trim()) {
        await sprintMutation.mutateAsync({ type: "update", id: sprint.id, goal: goal.trim() });
      }
      await sprintMutation.mutateAsync({
        type: "start",
        id: sprint.id,
        startDate: new Date(`${startDate}T00:00:00`).toISOString(),
        endDate: new Date(`${endDate}T23:59:59`).toISOString(),
      });
      toast.success(`${sprint.name} started`);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog open={Boolean(sprint)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Start {sprint?.name}</DialogTitle>
            <DialogDescription>
              {plural(sprint?.issueCount ?? 0, "issue")} · {plural(sprint?.totalPoints ?? 0, "point")} will be committed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <label className="grid gap-1 text-xs text-[var(--color-text-secondary)]">
              Start date
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
            </label>
            <label className="grid gap-1 text-xs text-[var(--color-text-secondary)]">
              End date
              <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
            </label>
          </div>
          <label className="grid gap-1 text-xs text-[var(--color-text-secondary)]">
            Sprint goal (optional)
            <Input value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="What should this sprint achieve?" />
          </label>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={sprintMutation.isPending}>
              Start sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CompleteSprintDialog({
  sprint,
  plannedSprints,
  onClose,
}: {
  sprint: SprintDTO | null;
  plannedSprints: SprintDTO[];
  onClose: () => void;
}) {
  const sprintMutation = useSprintMutation();
  const [target, setTarget] = useState("backlog");
  const unfinished = sprint ? sprint.issueCount - sprint.doneCount : 0;

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!sprint) return;

    try {
      await sprintMutation.mutateAsync({ type: "complete", id: sprint.id, moveIncompleteTo: target });
      toast.success(`${sprint.name} completed`);
      onClose();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog open={Boolean(sprint)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Complete {sprint?.name}</DialogTitle>
            <DialogDescription>
              {sprint?.doneCount ?? 0} done ({sprint?.donePoints ?? 0} points). {unfinished} unfinished.
            </DialogDescription>
          </DialogHeader>
          {unfinished > 0 ? (
            <label className="grid gap-1 text-xs text-[var(--color-text-secondary)]">
              Move unfinished issues to
              <select className={cn(selectClass, "h-10 text-sm")} value={target} onChange={(event) => setTarget(event.target.value)}>
                <option value="backlog">Backlog</option>
                {plannedSprints.map((planned) => (
                  <option key={planned.id} value={planned.id}>
                    {planned.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={sprintMutation.isPending}>
              Complete sprint
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function QuickCreate({ epics }: { epics: TaskDTO[] }) {
  const createTask = useCreateTaskMutation();
  const [title, setTitle] = useState("");
  const [issueType, setIssueType] = useState<IssueType>("story");
  const [parentId, setParentId] = useState("");
  const [points, setPoints] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();

    if (trimmed.length < 2) {
      toast.error("Give the issue a title of at least 2 characters");
      return;
    }

    const storyPoints = points.trim() ? Number(points) : null;
    if (storyPoints !== null && (!Number.isInteger(storyPoints) || storyPoints < 0 || storyPoints > 100)) {
      toast.error("Story points must be a whole number from 0 to 100");
      return;
    }

    createTask.mutate(
      {
        title: trimmed,
        issueType,
        parentId: issueType !== "epic" && parentId ? parentId : null,
        storyPoints,
      },
      {
        onSuccess: () => {
          setTitle("");
          setPoints("");
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    );
  };

  return (
    <form onSubmit={submit} className="orbit-card flex flex-wrap items-center gap-2 p-3">
      <label className="sr-only" htmlFor="quick-type">
        Issue type
      </label>
      <select id="quick-type" className={cn(selectClass, "h-10")} value={issueType} onChange={(event) => setIssueType(event.target.value as IssueType)}>
        {(Object.keys(issueTypeMeta) as IssueType[]).map((type) => (
          <option key={type} value={type}>
            {issueTypeMeta[type].label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="quick-title">
        Issue title
      </label>
      <Input
        id="quick-title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs to be done?"
        className="min-w-48 flex-1"
      />
      {issueType !== "epic" && epics.length > 0 ? (
        <>
          <label className="sr-only" htmlFor="quick-epic">
            Epic
          </label>
          <select id="quick-epic" className={cn(selectClass, "h-10 max-w-44")} value={parentId} onChange={(event) => setParentId(event.target.value)}>
            <option value="">No epic</option>
            {epics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.key ? `${epic.key} ` : ""}
                {epic.title}
              </option>
            ))}
          </select>
        </>
      ) : null}
      <label className="sr-only" htmlFor="quick-points">
        Story points
      </label>
      <Input id="quick-points" inputMode="numeric" value={points} onChange={(event) => setPoints(event.target.value)} placeholder="Points" className="w-20" />
      <Button type="submit" disabled={createTask.isPending}>
        <Plus className="h-4 w-4" />
        Add to backlog
      </Button>
    </form>
  );
}

function SprintSection({
  sprint,
  children,
  actions,
}: {
  sprint: SprintDTO;
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  const progress = sprint.totalPoints > 0 ? Math.round((sprint.donePoints / sprint.totalPoints) * 100) : 0;

  return (
    <section className="orbit-card overflow-hidden" aria-label={sprint.name}>
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border-secondary)] px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{sprint.name}</h2>
            {sprint.status === "active" ? (
              <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-accent)]">Active</span>
            ) : null}
            <span className="text-xs text-[var(--color-text-tertiary)]">{formatRange(sprint)}</span>
          </div>
          {sprint.goal ? <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">{sprint.goal}</p> : null}
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {plural(sprint.issueCount, "issue")} · {sprint.status === "active" ? `${sprint.donePoints}/${sprint.totalPoints}` : sprint.totalPoints} pts
        </span>
        {actions}
      </header>
      {sprint.status === "active" ? (
        <div className="h-1 bg-[var(--color-surface-hover)]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Sprint progress">
          <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${progress}%` }} />
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function BacklogWorkspace() {
  const tasksQuery = useTasksQuery();
  const sprintsQuery = useSprintsQuery();
  const sprintMutation = useSprintMutation();
  const [startingSprint, setStartingSprint] = useState<SprintDTO | null>(null);
  const [completingSprint, setCompletingSprint] = useState<SprintDTO | null>(null);

  const issues = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);
  const sprints = sprintsQuery.data ?? [];
  const activeSprint = sprints.find((sprint) => sprint.status === "active") ?? null;
  const plannedSprints = sprints.filter((sprint) => sprint.status === "planned");
  const plannedOrActiveSprints = sprints.filter((sprint) => sprint.status !== "completed");

  const epics = useMemo(() => issues.filter((issue) => issue.issueType === "epic"), [issues]);
  const epicsById = useMemo(() => new Map(epics.map((epic) => [epic.id, epic.title])), [epics]);
  // Oldest first, like a ranked backlog; epics are containers and live in their own list.
  const workItems = useMemo(
    () => issues.filter((issue) => issue.issueType !== "epic").sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [issues],
  );
  const issuesFor = (sprintId: string | null) => workItems.filter((issue) => (issue.sprintId ?? null) === sprintId);
  const backlog = issuesFor(null);

  const runSprintAction = (action: Parameters<typeof sprintMutation.mutate>[0], success: string) =>
    sprintMutation.mutate(action, {
      onSuccess: () => toast.success(success),
      onError: (error) => toast.error(errorMessage(error)),
    });

  if (tasksQuery.isError || sprintsQuery.isError) {
    return (
      <div className="orbit-card p-8 text-center">
        <p className="text-sm text-[var(--color-text-primary)]">Couldn&apos;t load the backlog.</p>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{errorMessage(tasksQuery.error ?? sprintsQuery.error)}</p>
        <Button className="mt-4" variant="secondary" onClick={() => void Promise.all([tasksQuery.refetch(), sprintsQuery.refetch()])}>
          Try again
        </Button>
      </div>
    );
  }

  const isLoading = tasksQuery.isLoading || sprintsQuery.isLoading;

  return (
    <div className="mx-auto max-w-5xl space-y-5 page-animate">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">Backlog</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Plan sprints, estimate work and track progress.</p>
        </div>
        <Button variant="secondary" onClick={() => runSprintAction({ type: "create" }, "Sprint created")} disabled={sprintMutation.isPending}>
          <Plus className="h-4 w-4" />
          Create sprint
        </Button>
      </header>

      <QuickCreate epics={epics} />

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((key) => (
            <div key={key} className="orbit-card h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {activeSprint ? (
            <SprintSection
              sprint={activeSprint}
              actions={
                <Button size="sm" onClick={() => setCompletingSprint(activeSprint)}>
                  Complete sprint
                </Button>
              }
            >
              <BurndownChart sprintId={activeSprint.id} />
              <IssueList
                issues={issuesFor(activeSprint.id)}
                epicsById={epicsById}
                plannedOrActiveSprints={plannedOrActiveSprints}
                emptyText="No issues in this sprint yet. Move some in from the backlog."
              />
            </SprintSection>
          ) : null}

          {plannedSprints.map((sprint) => (
            <SprintSection
              key={sprint.id}
              sprint={sprint}
              actions={
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={Boolean(activeSprint) || sprint.issueCount === 0}
                    title={activeSprint ? "Complete the active sprint first" : sprint.issueCount === 0 ? "Add issues before starting" : undefined}
                    onClick={() => setStartingSprint(sprint)}
                  >
                    Start sprint
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label={`Delete ${sprint.name}`}
                    onClick={() => {
                      if (confirm(`Delete ${sprint.name}? Its issues move back to the backlog.`)) {
                        runSprintAction({ type: "delete", id: sprint.id }, "Sprint deleted");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              }
            >
              <IssueList
                issues={issuesFor(sprint.id)}
                epicsById={epicsById}
                plannedOrActiveSprints={plannedOrActiveSprints}
                emptyText="Plan this sprint by moving issues in from the backlog."
              />
            </SprintSection>
          ))}

          <section className="orbit-card overflow-hidden" aria-label="Backlog">
            <header className="flex items-center gap-3 border-b border-[var(--color-border-secondary)] px-4 py-3">
              <h2 className="flex-1 text-sm font-semibold text-[var(--color-text-primary)]">Backlog</h2>
              <span className="text-xs text-[var(--color-text-secondary)]">{plural(backlog.length, "issue")}</span>
            </header>
            <IssueList
              issues={backlog}
              epicsById={epicsById}
              plannedOrActiveSprints={plannedOrActiveSprints}
              emptyText="Your backlog is empty. Add an issue above."
            />
          </section>

          {epics.length > 0 ? (
            <section className="orbit-card overflow-hidden" aria-label="Epics">
              <header className="flex items-center gap-2 border-b border-[var(--color-border-secondary)] px-4 py-3">
                <Layers className="h-4 w-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Epics</h2>
              </header>
              <ul className="divide-y divide-[var(--color-border-secondary)]">
                {epics.map((epic) => {
                  const children = workItems.filter((issue) => issue.parentId === epic.id);
                  const done = children.filter((issue) => issue.status === "done").length;
                  const percent = children.length ? Math.round((done / children.length) * 100) : 0;
                  return (
                    <li key={epic.id} className="flex items-center gap-3 px-4 py-2.5">
                      <IssueTypeIcon type="epic" />
                      <span className="w-16 shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">{epic.key}</span>
                      <Link href={`/tasks?taskId=${encodeURIComponent(epic.id)}`} className="min-w-0 flex-1 truncate text-sm hover:underline">
                        {epic.title}
                      </Link>
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {done}/{children.length} done
                      </span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-surface-hover)]" aria-hidden="true">
                        <div className="h-full bg-violet-400" style={{ width: `${percent}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <VelocityCard />
        </>
      )}

      <StartSprintDialog key={startingSprint?.id ?? "none"} sprint={startingSprint} onClose={() => setStartingSprint(null)} />
      <CompleteSprintDialog
        key={completingSprint?.id ?? "none-complete"}
        sprint={completingSprint}
        plannedSprints={plannedSprints}
        onClose={() => setCompletingSprint(null)}
      />
    </div>
  );
}
