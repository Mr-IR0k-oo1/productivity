"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  FolderKanban,
  TrendingUp,
  Users2,
  Zap,
} from "lucide-react";

import { useProjectsQuery } from "@/hooks/useProjects";
import { useTasksQuery } from "@/hooks/useTasks";
import { useWorkspaceMembersQuery } from "@/hooks/useWorkspaceMembers";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ExecutiveOrgSummary() {
  const { data: projects = [], isLoading: loadingProjects } = useProjectsQuery();
  const { data: tasks = [] } = useTasksQuery();
  const { data: members = [] } = useWorkspaceMembersQuery();

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const overdueTasks = tasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    return new Date(t.dueDate) < new Date();
  }).length;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Link href="/projects" className="group block">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] transition-all group-hover:border-[var(--color-accent)]/50 group-hover:bg-[var(--color-surface-hover)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Active Projects</span>
                <FolderKanban className="h-4 w-4 text-[var(--color-accent)]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {activeProjects.length}
              </p>
              <span className="text-[11px] font-medium text-[var(--color-accent)] inline-flex items-center gap-1 group-hover:underline">
                View portfolio →
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks" className="group block">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] transition-all group-hover:border-emerald-500/50 group-hover:bg-[var(--color-surface-hover)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Completed Tasks</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-500">
                {completedTasks}
              </p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                Total delivered
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/tasks?status=todo" className="group block">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] transition-all group-hover:border-rose-500/50 group-hover:bg-[var(--color-surface-hover)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Overdue Tasks</span>
                <Clock className="h-4 w-4 text-rose-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-rose-500">
                {overdueTasks}
              </p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                Needs attention
              </span>
            </CardContent>
          </Card>
        </Link>

        <Link href="/teams" className="group block">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] transition-all group-hover:border-purple-500/50 group-hover:bg-[var(--color-surface-hover)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Team Members</span>
                <Users2 className="h-4 w-4 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-purple-500">
                {members.length}
              </p>
              <span className="text-[11px] font-medium text-purple-500 inline-flex items-center gap-1 group-hover:underline">
                View directory →
              </span>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Projects Health & Progress Row */}
      <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-sm font-semibold text-[var(--color-text-primary)]">
              Active Strategic Projects
            </CardTitle>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Current initiatives moving company milestones forward.
            </p>
          </div>
          <Link
            href="/projects"
            className="text-xs font-semibold text-[var(--color-accent)] hover:underline inline-flex items-center gap-1"
          >
            <span>All projects</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {loadingProjects ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : activeProjects.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-secondary)]">
              No active projects yet. Create your first project to align your team.
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-secondary)]">
              {activeProjects.slice(0, 4).map((project) => {
                const projectTaskList = tasks.filter((t) => t.projectId === project.id);
                const total = projectTaskList.length;
                const done = projectTaskList.filter((t) => t.status === "done").length;
                const percent = total > 0 ? Math.round((done / total) * 100) : 0;

                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-[var(--color-surface-hover)] p-2 rounded-lg transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {project.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-1.5">
                          {project.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] truncate mt-0.5">
                        {project.description || "No description provided."}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="w-28">
                        <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mb-1">
                          <span>{percent}%</span>
                          <span>{done}/{total}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-[var(--color-surface-hover)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--color-accent)]"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">
                        {project.endDate ? format(new Date(project.endDate), "MMM d") : "No due date"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
