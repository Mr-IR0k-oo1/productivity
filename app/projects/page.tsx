"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  FolderKanban,
  FolderPlus,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import { useCreateProjectMutation, useProjectsQuery, type ProjectDTO, type ProjectStatus } from "@/hooks/useProjects";
import { useTasksQuery } from "@/hooks/useTasks";
import { useWorkspaceMembersQuery } from "@/hooks/useWorkspaceMembers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ProjectsPage() {
  const { data: projects = [], isLoading, isError, refetch } = useProjectsQuery();
  const { data: allTasks = [] } = useTasksQuery();
  const { data: members = [] } = useWorkspaceMembersQuery();
  const createProject = useCreateProjectMutation();

  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed" | "archived">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Compute metrics
  const activeCount = useMemo(() => projects.filter((p) => p.status === "active").length, [projects]);
  const completedCount = useMemo(() => projects.filter((p) => p.status === "completed").length, [projects]);
  const archivedCount = useMemo(() => projects.filter((p) => p.status === "archived").length, [projects]);

  // Compute tasks per project & progress
  const projectStats = useMemo(() => {
    const stats: Record<string, { total: number; done: number; percent: number }> = {};
    for (const project of projects) {
      const pTasks = allTasks.filter((t) => t.projectId === project.id);
      const total = pTasks.length;
      const done = pTasks.filter((t) => t.status === "done").length;
      const percent = total > 0 ? Math.round((done / total) * 100) : 0;
      stats[project.id] = { total, done, percent };
    }
    return stats;
  }, [projects, allTasks]);

  const filteredProjects = useMemo(() => {
    let list = [...projects];

    if (activeTab !== "all") {
      list = list.filter((p) => p.status === activeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [projects, activeTab, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setFormError(null);
    try {
      await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });

      setIsModalOpen(false);
      setName("");
      setDescription("");
      setStatus("active");
      setStartDate("");
      setEndDate("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create project";
      setFormError(msg);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
              Project Portfolio
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
              Organize strategic company initiatives, monitor milestones, and align team execution.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setIsModalOpen(true)}
              className="gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Total Projects</span>
                <FolderKanban className="h-4 w-4 text-[var(--color-accent)]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {projects.length}
              </p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Across workspace</span>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Active Initiatives</span>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-500">{activeCount}</p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Currently in progress</span>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Completed</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-500">{completedCount}</p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Successfully shipped</span>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Archived</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-amber-500">{archivedCount}</p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Historical record</span>
            </CardContent>
          </Card>
        </div>

        {/* Filter bar & View toggles */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-secondary)] pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "all"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              All Projects ({projects.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "active"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "completed"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Completed ({completedCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("archived")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "archived"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Archived ({archivedCount})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)]"
              />
            </div>

            <div className="flex items-center rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                )}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={cn(
                  "rounded-md p-1.5 transition-colors",
                  viewMode === "table"
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]",
                )}
                title="Table view"
                aria-label="Table view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="space-y-3 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-5"
              >
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <div className="flex justify-between pt-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-red-500/20 bg-red-500/5 p-8 text-center">
            <p className="text-sm font-semibold text-red-500">Failed to load projects</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3 text-xs">
              Retry
            </Button>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]/40 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-surface-hover)] text-[var(--color-text-tertiary)]">
              <FolderPlus className="h-6 w-6 text-[var(--color-accent)]" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
              No Projects Found
            </h3>
            <p className="mt-1 max-w-sm text-xs text-[var(--color-text-secondary)]">
              {searchQuery
                ? `No projects matching "${searchQuery}". Try adjusting your filters.`
                : "Create your first project to align your team, assign tasks, and track milestones."}
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Project</span>
            </Button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => {
              const stats = projectStats[project.id] || { total: 0, done: 0, percent: 0 };
              const statusColor =
                project.status === "completed"
                  ? "border-emerald-500/20 text-emerald-500 bg-emerald-500/10"
                  : project.status === "archived"
                  ? "border-amber-500/20 text-amber-500 bg-amber-500/10"
                  : "border-blue-500/20 text-blue-500 bg-blue-500/10";

              return (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-5 shadow-xs transition-all hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-hover)] hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">
                        {project.name}
                      </h3>
                      <Badge variant="outline" className={cn("text-[10px] capitalize font-semibold py-0 px-2", statusColor)}>
                        {project.status}
                      </Badge>
                    </div>

                    <p className="mt-2 text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                      {project.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-5 space-y-3 pt-3 border-t border-[var(--color-border-secondary)]">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-medium text-[var(--color-text-tertiary)] mb-1">
                        <span>Progress ({stats.done}/{stats.total} tasks)</span>
                        <span className="font-semibold text-[var(--color-text-primary)]">{stats.percent}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                          style={{ width: `${stats.percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Timeline & Due Date */}
                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-tertiary)]">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {project.endDate
                            ? `Due ${format(new Date(project.endDate), "MMM d, yyyy")}`
                            : "No target date"}
                        </span>
                      </div>
                      <span className="font-medium text-[var(--color-accent)] group-hover:underline">
                        Details →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)] text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Tasks</th>
                    <th className="px-4 py-3">Target Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-secondary)]">
                  {filteredProjects.map((project) => {
                    const stats = projectStats[project.id] || { total: 0, done: 0, percent: 0 };
                    return (
                      <tr key={project.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                        <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
                          <Link href={`/projects/${project.id}`} className="hover:text-[var(--color-accent)]">
                            {project.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] capitalize font-semibold py-0 px-1.5">
                            {project.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                              <div
                                className="h-full bg-[var(--color-accent)] rounded-full"
                                style={{ width: `${stats.percent}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-[var(--color-text-tertiary)]">{stats.percent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                          {stats.done}/{stats.total}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text-tertiary)]">
                          {project.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/projects/${project.id}`}
                            className="font-medium text-[var(--color-accent)] hover:underline"
                          >
                            Open →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <FolderPlus className="h-4 w-4" />
                  </div>
                  <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                    Create New Project
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
              </div>

              <Dialog.Description className="text-xs text-[var(--color-text-secondary)] mb-4">
                Set up a new project initiative to organize related tasks, sprints, and team members.
              </Dialog.Description>

              {formError && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-500">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Project Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Q3 Mobile App Redesign"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-xs bg-[var(--color-surface-strong)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe project objectives and deliverables..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-2.5 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-xs bg-[var(--color-surface-strong)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Target Due Date
                    </label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-xs bg-[var(--color-surface-strong)]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" size="sm" className="text-xs">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    disabled={createProject.isPending || !name.trim()}
                    className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
                  >
                    {createProject.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
  );
}
