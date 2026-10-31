"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  ListTodo,
  MoreVertical,
  Plus,
  Settings,
  Trash2,
  Users,
} from "lucide-react";

import {
  useDeleteProjectMutation,
  useProjectQuery,
  useUpdateProjectMutation,
  type ProjectStatus,
} from "@/hooks/useProjects";
import { useCreateTaskMutation, useTasksQuery } from "@/hooks/useTasks";
import { useWorkspaceMembersQuery } from "@/hooks/useWorkspaceMembers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Tab = "overview" | "tasks" | "members" | "settings";

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const { data: project, isLoading, isError, refetch } = useProjectQuery(projectId);
  const { data: allTasks = [] } = useTasksQuery();
  const { data: members = [] } = useWorkspaceMembersQuery();
  const updateProject = useUpdateProjectMutation();
  const deleteProject = useDeleteProjectMutation();
  const createTask = useCreateTaskMutation();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Settings state
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<ProjectStatus>("active");
  const [hasInitSettings, setHasInitSettings] = useState(false);

  if (project && !hasInitSettings) {
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditStatus(project.status);
    setHasInitSettings(true);
  }

  // Filter tasks belonging to this project
  const projectTasks = useMemo(
    () => allTasks.filter((t) => t.projectId === projectId),
    [allTasks, projectId],
  );

  const stats = useMemo(() => {
    const total = projectTasks.length;
    const done = projectTasks.filter((t) => t.status === "done").length;
    const inProgress = projectTasks.filter((t) => t.status === "in_progress").length;
    const todo = projectTasks.filter((t) => t.status === "todo").length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, inProgress, todo, percent };
  }, [projectTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await createTask.mutateAsync({
      title: newTaskTitle.trim(),
      projectId,
      status: "todo",
    });

    setNewTaskTitle("");
    setIsAddingTask(false);
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || !project) return;

    await updateProject.mutateAsync({
      id: project.id,
      name: editName.trim(),
      description: editDescription.trim() || null,
      status: editStatus,
    });
  };

  const handleDelete = async () => {
    if (!project) return;
    if (confirm("Are you sure you want to delete this project? Tasks will remain unassigned.")) {
      await deleteProject.mutateAsync(project.id);
      router.push("/projects");
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-3 text-lg font-bold text-[var(--color-text-primary)]">Project Not Found</h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          The requested project does not exist or you may lack permissions.
        </p>
        <Link href="/projects">
          <Button variant="outline" size="sm" className="mt-4 text-xs">
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Back Link */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Projects</span>
        </Link>

        {/* Project Header Banner */}
        <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-6 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-xs">
                  <FolderKanban className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                      {project.name}
                    </h1>
                    <Badge variant="outline" className="text-[10px] capitalize font-semibold py-0 px-2">
                      {project.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    {project.description || "No project description provided."}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Progress Widget */}
            <div className="min-w-[180px] rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3.5">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-1.5">
                <span className="font-medium">Completion</span>
                <span className="font-bold text-[var(--color-text-primary)]">{stats.percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-300"
                  style={{ width: `${stats.percent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--color-text-tertiary)]">
                {stats.done} of {stats.total} tasks completed
              </p>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="mt-6 flex items-center gap-2 border-t border-[var(--color-border-secondary)] pt-4">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "overview"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "tasks"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Tasks ({projectTasks.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "members"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Team ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                activeTab === "settings"
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              Settings
            </button>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {/* Task Breakdown Card */}
              <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Task Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-center">
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">To Do</span>
                      <p className="mt-1 text-xl font-bold text-[var(--color-text-primary)]">{stats.todo}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-center">
                      <span className="text-[11px] text-blue-500">In Progress</span>
                      <p className="mt-1 text-xl font-bold text-blue-500">{stats.inProgress}</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 text-center">
                      <span className="text-[11px] text-emerald-500">Done</span>
                      <p className="mt-1 text-xl font-bold text-emerald-500">{stats.done}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Tasks List */}
              <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Project Issues & Tasks
                  </CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("tasks")}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {projectTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-[var(--color-text-secondary)]">
                      No tasks assigned to this project yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--color-border-secondary)]">
                      {projectTasks.slice(0, 5).map((task) => (
                        <div key={task.id} className="flex items-center justify-between py-2.5">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                              {task.key || "ORB"}
                            </span>
                            <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                              {task.title}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {task.status.replace("_", " ")}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar info */}
            <div className="space-y-6">
              <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Project Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Start Date</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {project.startDate ? format(new Date(project.startDate), "MMM d, yyyy") : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Target Deadline</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {project.endDate ? format(new Date(project.endDate), "MMM d, yyyy") : "Not set"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-tertiary)]">Created</span>
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {format(new Date(project.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Tasks */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-[var(--color-text-secondary)]">
                Showing all tasks associated with <strong className="text-[var(--color-text-primary)]">{project.name}</strong>.
              </p>
              <Button
                size="sm"
                onClick={() => setIsAddingTask(true)}
                className="gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task to Project</span>
              </Button>
            </div>

            {isAddingTask && (
              <form
                onSubmit={handleAddTask}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-surface-strong)] p-3"
              >
                <Input
                  type="text"
                  placeholder="Task title..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="h-8 text-xs bg-[var(--color-surface)]"
                  autoFocus
                />
                <Button type="submit" size="sm" className="h-8 text-xs bg-[var(--color-accent)] text-white">
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingTask(false)}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
              </form>
            )}

            <div className="overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
              {projectTasks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[var(--color-text-secondary)]">
                  No tasks assigned to this project yet. Use the button above to add one.
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-border-secondary)]">
                  {projectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3.5 hover:bg-[var(--color-surface-hover)] transition-colors"
                    >
                      <div className="flex items-center gap-3 truncate">
                        <span className="font-mono text-xs font-semibold text-[var(--color-text-tertiary)]">
                          {task.key || "ORB"}
                        </span>
                        <span className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                          {task.title}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-2">
                        {task.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Members */}
        {activeTab === "members" && (
          <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-6">
            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
              Workspace Team Collaborators
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mb-4">
              All active members of this workspace have access to contribute to this project.
            </p>
            <div className="divide-y divide-[var(--color-border-secondary)]">
              {members.map((member) => (
                <div key={member.user.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-white">
                      {(member.user.fullName || member.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                        {member.user.fullName || member.user.email}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">{member.user.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {member.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Settings */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Project Name
                    </label>
                    <Input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xs bg-[var(--color-surface)]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                      Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                      className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <Button
                    type="submit"
                    disabled={updateProject.isPending}
                    className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
                  >
                    {updateProject.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-500/20 bg-red-500/5">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-red-500">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">Delete this project</p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    Once deleted, it cannot be recovered. Assigned tasks will not be deleted.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteProject.isPending}
                  className="gap-1.5 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Project</span>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
  );
}
