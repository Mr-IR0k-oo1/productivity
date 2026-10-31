"use client";

import { useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Briefcase,
  Check,
  CheckCircle2,
  FolderKanban,
  Mail,
  MoreVertical,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Users2,
  X,
} from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { useTasksQuery } from "@/hooks/useTasks";
import { useWorkspaceMembersQuery, type WorkspaceMemberDTO } from "@/hooks/useWorkspaceMembers";
import { useProjectsQuery } from "@/hooks/useProjects";
import { fetchApiJson } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DepartmentDef = {
  id: string;
  name: string;
  lead: string;
  description: string;
  color: string;
};

const DEFAULT_DEPARTMENTS: DepartmentDef[] = [
  {
    id: "eng",
    name: "Engineering & Architecture",
    lead: "Alex Chen",
    description: "Core platform, frontend systems, Tauri desktop, and Rust backend execution.",
    color: "from-blue-500/20 to-indigo-500/10 border-blue-500/30",
  },
  {
    id: "prod",
    name: "Product & UX Design",
    lead: "Sarah Lin",
    description: "Design systems, user workflows, sprint specifications, and customer discovery.",
    color: "from-purple-500/20 to-pink-500/10 border-purple-500/30",
  },
  {
    id: "ops",
    name: "Operations & Growth",
    lead: "David Miller",
    description: "Business operations, client onboarding, analytics, and organizational enablement.",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30",
  },
];

export default function TeamsPage() {
  const { workspaceId, authToken, workspaceRole } = useSessionContext();
  const isPrivileged = workspaceRole === "owner" || workspaceRole === "admin";

  const { data: members = [], isLoading, isError, refetch } = useWorkspaceMembersQuery();
  const { data: allTasks = [] } = useTasksQuery();
  const { data: projects = [] } = useProjectsQuery();

  const [activeTab, setActiveTab] = useState<"directory" | "teams">("directory");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member" | "viewer">("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);

  // Calculate member workload
  const memberWorkloads = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const task of allTasks) {
      if (task.assigneeId && task.status !== "done") {
        counts[task.assigneeId] = (counts[task.assigneeId] || 0) + 1;
      }
    }
    return counts;
  }, [allTasks]);

  const filteredMembers = useMemo(() => {
    let list = [...members];

    if (roleFilter !== "all") {
      list = list.filter((m) => m.role === roleFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          (m.user.fullName && m.user.fullName.toLowerCase().includes(q)) ||
          m.user.email.toLowerCase().includes(q) ||
          (m.user.jobTitle && m.user.jobTitle.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [members, roleFilter, searchQuery]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviteError(null);
    setInviteSuccess(false);
    setIsSubmittingInvite(true);

    try {
      await fetchApiJson("/api/workspace/members", {
        method: "POST",
        session: { workspaceId, authToken },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      setInviteSuccess(true);
      setInviteEmail("");
      refetch();
      setTimeout(() => {
        setInviteModalOpen(false);
        setInviteSuccess(false);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to invite member";
      setInviteError(msg);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
              Team & Directory
            </h1>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
              Manage organization people, departmental teams, permissions, and member capacity.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => setInviteModalOpen(true)}
              className="gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
            >
              <UserPlus className="h-4 w-4" />
              <span>Invite Member</span>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Total People</span>
                <Users className="h-4 w-4 text-[var(--color-accent)]" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {members.length}
              </p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Active in workspace</span>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Departments</span>
                <Briefcase className="h-4 w-4 text-purple-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-purple-500">
                {DEFAULT_DEPARTMENTS.length}
              </p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Functional squads</span>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Active Tasks</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-500">
                {allTasks.filter((t) => t.status !== "done").length}
              </p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Distributed work</span>
            </CardContent>
          </Card>

          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <span>Active Projects</span>
                <FolderKanban className="h-4 w-4 text-blue-500" />
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-blue-500">
                {projects.filter((p) => p.status === "active").length}
              </p>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Across all squads</span>
            </CardContent>
          </Card>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 border-b border-[var(--color-border-secondary)] pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "directory"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            People Directory ({members.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("teams")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              activeTab === "teams"
                ? "bg-[var(--color-accent)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
            )}
          >
            Squads & Departments ({DEFAULT_DEPARTMENTS.length})
          </button>
        </div>

        {/* Tab: Directory */}
        {activeTab === "directory" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                  <Input
                    type="text"
                    placeholder="Search people by name, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)]"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="h-8 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                >
                  <option value="all">All Roles</option>
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <span className="text-xs text-[var(--color-text-tertiary)]">
                Showing {filteredMembers.length} member{filteredMembers.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Member Table */}
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)] text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Member</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Title / Dept</th>
                      <th className="px-4 py-3">Workload</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-secondary)]">
                    {filteredMembers.map((member) => {
                      const activeWorkload = memberWorkloads[member.user.id] || 0;
                      const roleColor =
                        member.role === "owner"
                          ? "border-purple-500/20 text-purple-500 bg-purple-500/10"
                          : member.role === "admin"
                          ? "border-blue-500/20 text-blue-500 bg-blue-500/10"
                          : "border-zinc-500/20 text-[var(--color-text-secondary)] bg-zinc-500/10";

                      return (
                        <tr key={member.user.id} className="hover:bg-[var(--color-surface-hover)] transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-white">
                                {(member.user.fullName || member.user.email).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-[var(--color-text-primary)] truncate">
                                  {member.user.fullName || "Unnamed User"}
                                </p>
                                <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                                  {member.user.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={cn("text-[10px] capitalize font-semibold py-0 px-2", roleColor)}>
                              {member.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                            {member.user.jobTitle || "Team Member"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "font-medium",
                                  activeWorkload > 5
                                    ? "text-amber-500"
                                    : activeWorkload > 0
                                    ? "text-[var(--color-text-primary)]"
                                    : "text-[var(--color-text-tertiary)]",
                                )}
                              >
                                {activeWorkload} active task{activeWorkload !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-500">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Squads & Departments */}
        {activeTab === "teams" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_DEPARTMENTS.map((dept) => (
              <div
                key={dept.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-gradient-to-br p-6 shadow-xs",
                  dept.color,
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                      {dept.name}
                    </h3>
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {dept.description}
                  </p>
                </div>

                <div className="mt-6 space-y-2 border-t border-[var(--color-border-secondary)]/50 pt-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-tertiary)]">Squad Lead</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{dept.lead}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--color-text-tertiary)]">Collaborators</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">{members.length} members</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invite Member Modal */}
        <Dialog.Root open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in" />
            <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                    <UserPlus className="h-4 w-4" />
                  </div>
                  <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                    Invite Teammate
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
                Add an employee or collaborator to this organization workspace with an assigned permission role.
              </Dialog.Description>

              {inviteError && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-500">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-500 flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  <span>Invitation sent successfully!</span>
                </div>
              )}

              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Work Email *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="text-xs bg-[var(--color-surface-strong)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                    Organization Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "admin" | "member" | "viewer")}
                    className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                  >
                    <option value="member">Member — Can view and edit tasks, projects, ideas</option>
                    <option value="admin">Admin — Can manage members, projects, and settings</option>
                    <option value="viewer">Viewer — Read-only access across the workspace</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <Dialog.Close asChild>
                    <Button type="button" variant="outline" size="sm" className="text-xs">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    type="submit"
                    disabled={isSubmittingInvite || !inviteEmail.trim()}
                    className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90"
                  >
                    {isSubmittingInvite ? "Inviting..." : "Send Invitation"}
                  </Button>
                </div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
  );
}
