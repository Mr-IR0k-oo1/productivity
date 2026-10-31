"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Download,
  Info,
  Lock,
  Minus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type RoleKey = "owner" | "admin" | "manager" | "member" | "viewer" | "guest";

type PermissionRow = {
  id: string;
  name: string;
  description: string;
  category: "workspace" | "teams" | "projects" | "tasks" | "docs" | "time" | "integrations";
  roles: Record<RoleKey, boolean | "locked_true" | "locked_false">;
};

const initialPermissions: PermissionRow[] = [
  // Workspace & Security
  {
    id: "ws_billing",
    name: "Manage Billing & Subscriptions",
    description: "Purchase seats, update credit cards, and view invoice receipts.",
    category: "workspace",
    roles: { owner: "locked_true", admin: true, manager: false, member: false, viewer: false, guest: false },
  },
  {
    id: "ws_delete",
    name: "Delete Workspace",
    description: "Permanently delete company organization and purge all records.",
    category: "workspace",
    roles: { owner: "locked_true", admin: "locked_false", manager: false, member: false, viewer: false, guest: false },
  },
  {
    id: "ws_audit",
    name: "View Audit Trail & Security Logs",
    description: "Access immutable event timeline and actor IP traces.",
    category: "workspace",
    roles: { owner: "locked_true", admin: true, manager: false, member: false, viewer: false, guest: false },
  },
  {
    id: "ws_export",
    name: "Export Compliance Data & Backups",
    description: "Download complete workspace JSON/CSV compliance packages.",
    category: "workspace",
    roles: { owner: "locked_true", admin: true, manager: false, member: false, viewer: false, guest: false },
  },

  // Team & Members
  {
    id: "team_invite",
    name: "Invite Teammates & Guests",
    description: "Send workspace onboarding invites to company email domains.",
    category: "teams",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },
  {
    id: "team_roles",
    name: "Promote or Demote Member Roles",
    description: "Adjust privilege levels for team members in directory.",
    category: "teams",
    roles: { owner: "locked_true", admin: true, manager: false, member: false, viewer: false, guest: false },
  },
  {
    id: "team_remove",
    name: "Deactivate or Remove Members",
    description: "Revoke active workspace access and invalidate session tokens.",
    category: "teams",
    roles: { owner: "locked_true", admin: true, manager: false, member: false, viewer: false, guest: false },
  },

  // Projects & Portfolios
  {
    id: "proj_create",
    name: "Create Projects & Portfolios",
    description: "Initialize new strategic initiatives and project containers.",
    category: "projects",
    roles: { owner: "locked_true", admin: true, manager: true, member: true, viewer: false, guest: false },
  },
  {
    id: "proj_archive",
    name: "Archive or Delete Projects",
    description: "Conclude project cycles or delete empty project records.",
    category: "projects",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },
  {
    id: "proj_visibility",
    name: "Manage Project Privacy (Confidential)",
    description: "Restrict projects to specific squads or executives only.",
    category: "projects",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },

  // Tasks & Backlog
  {
    id: "task_create",
    name: "Create & Update Tasks",
    description: "Author issues, update status, assign teammates, and estimate story points.",
    category: "tasks",
    roles: { owner: "locked_true", admin: true, manager: true, member: true, viewer: false, guest: true },
  },
  {
    id: "task_delete",
    name: "Delete Tasks Permanently",
    description: "Erase task records from backlog and sprint boards.",
    category: "tasks",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },
  {
    id: "sprint_manage",
    name: "Start and Complete Sprints",
    description: "Trigger sprint lifecycles, velocity calculations, and rollover sweeps.",
    category: "tasks",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },

  // Time & Financials
  {
    id: "time_approve",
    name: "Approve Team Timesheets",
    description: "Review and approve submitted weekly work hours for payroll.",
    category: "time",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },
  {
    id: "time_rates",
    name: "View Billable Rates & Cost Burndown",
    description: "Inspect sensitive financial rates and budget consumption metrics.",
    category: "time",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },

  // Integrations & Automations
  {
    id: "integ_install",
    name: "Connect Third-Party Integrations",
    description: "Authenticate Slack, GitHub, Linear, and Figma oauth scopes.",
    category: "integrations",
    roles: { owner: "locked_true", admin: true, manager: false, member: false, viewer: false, guest: false },
  },
  {
    id: "auto_manage",
    name: "Author Workspace Automations",
    description: "Build trigger-action rules affecting organization workflows.",
    category: "integrations",
    roles: { owner: "locked_true", admin: true, manager: true, member: false, viewer: false, guest: false },
  },
];

const categoryLabels: Record<PermissionRow["category"], string> = {
  workspace: "Workspace & Security Governance",
  teams: "Team & Member Administration",
  projects: "Projects & Portfolios",
  tasks: "Tasks, Sprints & Execution",
  docs: "Knowledge Base & Documents",
  time: "Time Tracking & Approvals",
  integrations: "Integrations & Automations",
};

export default function RolesMatrixPage() {
  const [permissions, setPermissions] = useState<PermissionRow[]>(initialPermissions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSaved, setIsSaved] = useState(false);

  const togglePermission = (rowId: string, role: RoleKey) => {
    setPermissions((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const currentVal = row.roles[role];
        if (currentVal === "locked_true" || currentVal === "locked_false") return row; // cannot modify locked defaults
        return {
          ...row,
          roles: {
            ...row.roles,
            [role]: !currentVal,
          },
        };
      })
    );
    setIsSaved(false);
  };

  const handleSavePolicy = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(permissions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `orbit-roles-matrix-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredPermissions = permissions.filter((row) => {
    const matchesCategory = selectedCategory === "all" || row.category === selectedCategory;
    const matchesQuery =
      !searchQuery ||
      row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const categories = Array.from(new Set(filteredPermissions.map((p) => p.category)));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] mb-1">
            <Link href="/settings" className="hover:text-[var(--color-text-primary)] transition-colors">
              Settings
            </Link>
            <span>/</span>
            <span className="text-[var(--color-text-primary)]">Roles & Permissions</span>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Roles & Permissions Matrix
            </h1>
            <Badge variant="outline" className="text-xs font-semibold py-0.5 px-2">
              RBAC Policy
            </Badge>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Configure granular role capabilities across workspace administration, execution, and billing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportJson}
            className="gap-1.5 text-xs font-semibold rounded-xl border-[var(--color-border-secondary)] hover:bg-[var(--color-surface-hover)]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Policy</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSavePolicy}
            className="gap-1.5 text-xs font-semibold rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90 active:scale-95 shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaved ? "Policy Saved!" : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {isSaved && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Role permissions matrix updated successfully and synchronized to all active sessions.</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--color-text-tertiary)]" />
            <Input
              placeholder="Search capability or scope..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)] border-[var(--color-border-secondary)]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-2.5 text-xs text-[var(--color-text-secondary)] outline-hidden"
          >
            <option value="all">All Scopes</option>
            <option value="workspace">Workspace & Security</option>
            <option value="teams">Team Administration</option>
            <option value="projects">Projects</option>
            <option value="tasks">Tasks & Backlog</option>
            <option value="time">Time & Financials</option>
            <option value="integrations">Integrations & Automations</option>
          </select>
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)]">
          {filteredPermissions.length} permissions in policy
        </p>
      </div>

      {/* Interactive Matrix Table */}
      <Card className="rounded-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/80 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                <th className="px-5 py-4 w-80">Capability & Description</th>
                <th className="px-4 py-4 text-center">
                  <span className="font-bold text-amber-500">Owner</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <span className="font-bold text-purple-400">Admin</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <span className="font-bold text-blue-400">Manager</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <span className="font-bold text-emerald-400">Member</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <span className="font-bold text-slate-400">Viewer</span>
                </th>
                <th className="px-4 py-4 text-center">
                  <span className="font-bold text-slate-500">Guest</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-secondary)]">
              {categories.map((category) => {
                const categoryRows = filteredPermissions.filter((p) => p.category === category);
                return (
                  <React.Fragment key={category}>
                    <tr className="bg-[var(--color-surface)]/30">
                      <td
                        colSpan={7}
                        className="px-5 py-2.5 text-[11px] font-bold text-[var(--color-accent)] uppercase tracking-wider"
                      >
                        {categoryLabels[category]}
                      </td>
                    </tr>
                    {categoryRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        <td className="px-5 py-3">
                          <p className="font-semibold text-[var(--color-text-primary)]">
                            {row.name}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                            {row.description}
                          </p>
                        </td>

                        {(["owner", "admin", "manager", "member", "viewer", "guest"] as RoleKey[]).map((role) => {
                          const state = row.roles[role];
                          const isLocked = state === "locked_true" || state === "locked_false";
                          const isAllowed = state === true || state === "locked_true";

                          return (
                            <td key={role} className="px-4 py-3 text-center">
                              <button
                                type="button"
                                disabled={isLocked}
                                onClick={() => togglePermission(row.id, role)}
                                className={cn(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                                  isAllowed
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] border border-[var(--color-border-secondary)]",
                                  isLocked
                                    ? "cursor-not-allowed opacity-80"
                                    : "cursor-pointer hover:scale-105 active:scale-95"
                                )}
                                title={
                                  isLocked
                                    ? "Default immutable permission for this role"
                                    : `Toggle ${row.name} for ${role}`
                                }
                              >
                                {isAllowed ? (
                                  <Check className="h-4 w-4 stroke-[2.5]" />
                                ) : (
                                  <Minus className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import React from "react";
