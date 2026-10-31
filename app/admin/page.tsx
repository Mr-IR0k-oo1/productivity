"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Activity, CreditCard, PlusCircle, RefreshCw, Shield, ShieldCheck, UserMinus, Users } from "lucide-react";

import { useSessionContext } from "@/components/providers/SessionProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fetchApiJson } from "@/lib/api/client";
import type { WorkspaceRole } from "@/src/lib/workspace-access";

type AccessState = "loading" | "ready" | "error";

type WorkspaceProfileResponse = {
  data: {
    user: {
      id: string;
      email: string;
      fullName: string | null;
      jobTitle: string | null;
      avatarUrl: string | null;
    };
    workspace: {
      id: string;
      name: string;
      slug: string;
    };
    membership: {
      role: WorkspaceRole;
      isActive: boolean;
    };
  };
};

type WorkspaceMemberRecord = {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    jobTitle: string | null;
    avatarUrl: string | null;
  };
  role: WorkspaceRole;
  isActive: boolean;
  joinedAt: string;
};

type WorkspaceMembersResponse = {
  data: WorkspaceMemberRecord[];
};

const roleOrder: Record<WorkspaceRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
  viewer: 3,
};

function roleLabel(role: WorkspaceRole | string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleBadgeVariant(role: WorkspaceRole) {
  if (role === "owner" || role === "admin") {
    return "success" as const;
  }

  return "default" as const;
}

function memberInitials(member: WorkspaceMemberRecord) {
  const source = member.user.fullName?.trim() || member.user.email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatJoinedAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return format(date, "MMM d, yyyy");
}

function getAssignableRoles(actorRole: WorkspaceRole) {
  if (actorRole === "owner") {
    return ["owner", "admin", "member", "viewer"] as const;
  }

  return ["admin", "member", "viewer"] as const;
}

export default function AdminPanel() {
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [profile, setProfile] = useState<WorkspaceProfileResponse["data"] | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<WorkspaceRole>("member");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { isReady, userId, authToken, workspaceId, workspaceRole } = useSessionContext();
  const router = useRouter();

  const memberStats = useMemo(() => {
    const activeMembers = members.filter((member) => member.isActive).length;
    const admins = members.filter((member) => member.role === "admin" || member.role === "owner").length;

    return {
      total: members.length,
      activeMembers,
      admins,
    };
  }, [members]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!userId || !authToken) {
      router.replace("/login");
      return;
    }

    if (workspaceRole === "member" || workspaceRole === "viewer") {
      router.replace("/dashboard");
      return;
    }

    let isActive = true;

    const loadWorkspaceAdminData = async () => {
      try {
        const [profilePayload, membersPayload] = await Promise.all([
          fetchApiJson<WorkspaceProfileResponse>("/api/workspace/me", {
            session: { workspaceId, authToken },
          }),
          fetchApiJson<WorkspaceMembersResponse>("/api/workspace/members", {
            session: { workspaceId, authToken },
          }),
        ]);

        if (!isActive) {
          return;
        }

        if (!profilePayload.data.membership.isActive || profilePayload.data.membership.role === "member" || profilePayload.data.membership.role === "viewer") {
          router.replace("/dashboard");
          return;
        }

        setProfile(profilePayload.data);
        setMembers(
          [...membersPayload.data].sort((left, right) => {
            const roleDelta = roleOrder[left.role] - roleOrder[right.role];
            if (roleDelta !== 0) {
              return roleDelta;
            }

            if (left.isActive !== right.isActive) {
              return left.isActive ? -1 : 1;
            }

            return left.user.email.localeCompare(right.user.email);
          }),
        );
        setAccessState("ready");
      } catch (error) {
        if (!isActive) {
          return;
        }

        const message = error instanceof Error ? error.message : "";

        if (message.includes("Unauthorized") || message.includes("Invalid auth token")) {
          router.replace("/login");
          return;
        }

        setErrorMessage(message || "Failed to load admin panel");
        setAccessState("error");
      }
    };

    void loadWorkspaceAdminData();

    return () => {
      isActive = false;
    };
  }, [authToken, isReady, router, userId, workspaceId, workspaceRole]);

  const refreshMembers = async () => {
    try {
      const payload = await fetchApiJson<WorkspaceMembersResponse>("/api/workspace/members", {
        session: { workspaceId, authToken },
      });

      setMembers(
        [...payload.data].sort((left, right) => {
          const roleDelta = roleOrder[left.role] - roleOrder[right.role];
          if (roleDelta !== 0) {
            return roleDelta;
          }

          if (left.isActive !== right.isActive) {
            return left.isActive ? -1 : 1;
          }

          return left.user.email.localeCompare(right.user.email);
        }),
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to refresh members");
    }
  };

  const addMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyAction("add");
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = await fetchApiJson<{ data: { user: WorkspaceMemberRecord["user"] } }>("/api/workspace/members", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify({
          email: memberEmail.trim(),
          role: memberRole,
        }),
      });

      setMemberEmail("");
      setMemberRole("member");
      setSuccessMessage(`${payload.data.user.email} is now part of this workspace.`);
      await refreshMembers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to add member");
    } finally {
      setBusyAction(null);
    }
  };

  const updateMemberRole = async (memberId: string, nextRole: WorkspaceRole) => {
    setBusyAction(`role:${memberId}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await fetchApiJson<{ data: WorkspaceMemberRecord }>(`/api/workspace/members/${memberId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify({ role: nextRole }),
      });

      setSuccessMessage("Member role updated.");
      await refreshMembers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update member role");
    } finally {
      setBusyAction(null);
    }
  };

  const toggleMemberActive = async (member: WorkspaceMemberRecord) => {
    setBusyAction(`toggle:${member.user.id}`);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (member.isActive) {
        await fetchApiJson<{ data: WorkspaceMemberRecord }>(`/api/workspace/members/${member.user.id}`, {
          method: "DELETE",
          session: { workspaceId, authToken },
        });
        setSuccessMessage(`${member.user.email} was removed from the workspace.`);
      } else {
        await fetchApiJson<{ data: WorkspaceMemberRecord }>(`/api/workspace/members/${member.user.id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          session: { workspaceId, authToken },
          body: JSON.stringify({ isActive: true, role: member.role }),
        });
        setSuccessMessage(`${member.user.email} was reactivated.`);
      }

      await refreshMembers();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update member status");
    } finally {
      setBusyAction(null);
    }
  };

  if (accessState === "loading") {
    return <div className="p-10 text-center text-[var(--muted)]">Loading admin workspace...</div>;
  }

  if (accessState === "error") {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Admin panel unavailable</CardTitle>
            <CardDescription>{errorMessage ?? "An unexpected error occurred."}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => router.refresh()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const actorRole = workspaceRole ?? profile?.membership.role ?? "member";
  const actorRoleLabel = roleLabel(actorRole);
  const assignableRoles = getAssignableRoles(actorRole);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs text-[var(--muted)]">Admin</p>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-7 w-7 text-[var(--accent)]" />
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">Workspace members</h1>
            </div>
            <p className="max-w-2xl text-sm text-[var(--muted)]">
              Manage access for {profile?.workspace.name ?? "this workspace"}. Owners and admins can add members,
              update roles, and deactivate accounts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
              <p className="text-xs text-[var(--muted)]">Role</p>
              <p className="mt-1 font-medium text-[var(--foreground)]">{actorRoleLabel}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
              <p className="text-xs text-[var(--muted)]">Workspace</p>
              <p className="mt-1 font-medium text-[var(--foreground)]">{profile?.workspace.slug ?? workspaceId}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[color:var(--card-border)] pt-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Enterprise Governance:
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/settings/roles")}
            className="h-8 gap-1.5 text-xs font-medium rounded-xl border-[color:var(--card-border)] bg-[var(--surface-strong)] hover:bg-[var(--surface)]"
          >
            <Shield className="h-3.5 w-3.5 text-purple-400" />
            <span>Roles & Permissions Matrix</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/settings/audit")}
            className="h-8 gap-1.5 text-xs font-medium rounded-xl border-[color:var(--card-border)] bg-[var(--surface-strong)] hover:bg-[var(--surface)]"
          >
            <Activity className="h-3.5 w-3.5 text-blue-400" />
            <span>Audit Trail & Security</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.push("/settings/billing")}
            className="h-8 gap-1.5 text-xs font-medium rounded-xl border-[color:var(--card-border)] bg-[var(--surface-strong)] hover:bg-[var(--surface)]"
          >
            <CreditCard className="h-3.5 w-3.5 text-amber-400" />
            <span>Billing & Seat Allocation</span>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-[var(--accent-soft)] p-3 text-[var(--accent)]">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Members</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{memberStats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-[var(--color-success)]">
              <PlusCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Active</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{memberStats.activeMembers}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-[var(--color-warning)]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Privileged</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">{memberStats.admins}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Add Member</CardTitle>
            <CardDescription>Add an existing Orbit user to this workspace by email.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={addMember}>
              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">Email</label>
                <Input
                  type="email"
                  value={memberEmail}
                  onChange={(event) => setMemberEmail(event.target.value)}
                  placeholder="teammate@company.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[var(--muted)]">Role</label>
                <select
                  value={memberRole}
                  onChange={(event) => setMemberRole(event.target.value as WorkspaceRole)}
                  className="h-10 w-full rounded-md border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 text-sm text-[var(--foreground)] outline-none"
                >
                  {assignableRoles.map((role) => (
                    <option key={role} value={role}>
                      {roleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>

              {errorMessage ? <p className="text-sm text-rose-400">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-400">{successMessage}</p> : null}

              <Button type="submit" className="w-full" disabled={busyAction === "add"}>
                {busyAction === "add" ? "Adding member..." : "Add Member"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team members</CardTitle>
            <CardDescription>Update roles or remove access when people change teams.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void refreshMembers()}
                disabled={busyAction !== null}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              {members.map((member) => {
                const isSelf = member.user.id === userId;
                const roleLocked = member.role === "owner";
                const rowDisabled = busyAction === `role:${member.user.id}` || busyAction === `toggle:${member.user.id}`;
                const roleOptions: WorkspaceRole[] = member.role === "owner" ? ["owner"] : [...assignableRoles];

                return (
                  <div
                    key={member.user.id}
                    className="grid gap-4 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-4 md:grid-cols-[minmax(0,1.7fr)_150px_140px_auto] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11">
                        <AvatarFallback className="bg-[var(--surface)] text-[var(--foreground)]">{memberInitials(member)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--foreground)]">
                            {member.user.fullName?.trim() || member.user.email}
                          </p>
                          <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
                          {member.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          {member.user.email}
                          {member.user.jobTitle ? ` · ${member.user.jobTitle}` : ""}
                        </p>
                        <p className="text-xs text-[var(--muted)]">Joined {formatJoinedAt(member.joinedAt)}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[var(--muted)]">Role</label>
                      <select
                        value={member.role}
                        onChange={(event) => void updateMemberRole(member.user.id, event.target.value as WorkspaceRole)}
                        disabled={rowDisabled || roleLocked || isSelf}
                        className="h-10 w-full rounded-md border border-[color:var(--card-border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none disabled:opacity-60"
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-[var(--muted)]">Status</label>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.isActive ? "success" : "warning"}>{member.isActive ? "Enabled" : "Disabled"}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void toggleMemberActive(member)}
                        disabled={rowDisabled || roleLocked || isSelf}
                      >
                        <UserMinus className="h-4 w-4" />
                        {member.isActive ? "Deactivate" : "Reactivate"}
                      </Button>
                    </div>
                  </div>
                );
              })}

              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[color:var(--card-border)] p-8 text-center text-sm text-[var(--muted)]">
                  No members found for this workspace yet.
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}