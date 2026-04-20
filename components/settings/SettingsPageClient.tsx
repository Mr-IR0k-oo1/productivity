"use client";

import { format } from "date-fns";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Code2,
  Download,
  LogOut,
  Palette,
  RefreshCw,
  Save,
  Settings2,
  Shield,
  Sparkles,
  Trash2,
  Upload,
  UserMinus,
  Users,
  Workflow,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useUpdateWorkspaceSettingsMutation, useWorkspaceSettingsQuery, type WorkspaceMemberSummary } from "@/hooks/useWorkspaceSettings";
import { fetchApiJson } from "@/lib/api/client";
import { REMEMBER_ME_STORAGE_KEY, WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";
import { supabaseClient as supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";
import type { WorkspaceRole } from "@/src/lib/workspace-access";
import type { WorkspaceSettingsDocument, WorkspaceSettingsSectionKey } from "@/src/lib/workspace-settings";

type CategoryId =
  | "general"
  | "team"
  | "notifications"
  | "tasks"
  | "calendar"
  | "reports"
  | "integrations"
  | "security"
  | "appearance"
  | "advanced";

type BannerState = {
  kind: "success" | "error";
  message: string;
};

type SettingsCategory = {
  id: CategoryId;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const categories: SettingsCategory[] = [
  { id: "general", label: "General", description: "Workspace profile", icon: Settings2 },
  { id: "team", label: "Team", description: "Members and roles", icon: Users },
  { id: "notifications", label: "Notifications", description: "Delivery channels", icon: Bell },
  { id: "tasks", label: "Tasks", description: "Workflow defaults", icon: Workflow },
  { id: "calendar", label: "Calendar", description: "Hours and scheduling", icon: CalendarDays },
  { id: "reports", label: "Reports", description: "Analytics behavior", icon: BarChart3 },
  { id: "integrations", label: "Integrations", description: "Connected services", icon: Wrench },
  { id: "security", label: "Security", description: "Security and billing", icon: Shield },
  { id: "appearance", label: "Appearance", description: "UI customization", icon: Palette },
  { id: "advanced", label: "Advanced", description: "Developer options", icon: Code2 },
];

const settingSectionKeys: WorkspaceSettingsSectionKey[] = [
  "general",
  "notifications",
  "tasks",
  "calendar",
  "reports",
  "integrations",
  "security",
  "appearance",
  "advanced",
];

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const roleOrder: Record<WorkspaceRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

const selectClassName =
  "h-10 w-full rounded-md border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 text-sm text-[var(--foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]";
const textareaClassName =
  "min-h-[100px] w-full rounded-md border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]";

function cloneSettings(settings: WorkspaceSettingsDocument) {
  return typeof structuredClone === "function"
    ? structuredClone(settings)
    : (JSON.parse(JSON.stringify(settings)) as WorkspaceSettingsDocument);
}

function equalSection<T>(left: T, right: T) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function roleLabel(role: WorkspaceRole | null | undefined) {
  if (!role) {
    return "Member";
  }

  return role.charAt(0).toUpperCase() + role.slice(1);
}

function roleBadgeVariant(role: WorkspaceRole) {
  return role === "owner" || role === "admin" ? ("success" as const) : ("default" as const);
}

function sectionLabel(section: WorkspaceSettingsSectionKey) {
  const map: Record<WorkspaceSettingsSectionKey, string> = {
    general: "General",
    notifications: "Notifications",
    tasks: "Tasks",
    calendar: "Calendar",
    reports: "Reports",
    integrations: "Integrations",
    security: "Security",
    appearance: "Appearance",
    advanced: "Advanced",
  };

  return map[section];
}

function memberInitials(member: WorkspaceMemberSummary) {
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

function getAssignableRoles(actorRole: WorkspaceRole | null | undefined) {
  if (actorRole === "owner") {
    return ["owner", "admin", "member"] as const;
  }

  if (actorRole === "admin") {
    return ["admin", "member"] as const;
  }

  return [] as const;
}

function generateSecret(prefix: string) {
  const randomPart =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "")
      : `${Date.now()}${Math.random().toString(36).slice(2)}`.replace(/-/g, "");

  return `${prefix}_${randomPart.slice(0, 24)}`;
}

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();

  URL.revokeObjectURL(url);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read file."));
    };

    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });
}

function sortMembers(members: WorkspaceMemberSummary[]) {
  return [...members].sort((left, right) => {
    const roleDelta = roleOrder[left.role] - roleOrder[right.role];

    if (roleDelta !== 0) {
      return roleDelta;
    }

    if (left.isActive !== right.isActive) {
      return left.isActive ? -1 : 1;
    }

    const leftName = left.user.fullName?.trim() || left.user.email;
    const rightName = right.user.fullName?.trim() || right.user.email;
    return leftName.localeCompare(rightName);
  });
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
      {children}
      {hint ? <p className="text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-3 py-3">
      <div>
        <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
        <p className="text-xs text-[var(--muted)]">{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 accent-[var(--accent)]"
      />
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
  footer,
  danger = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode | null;
  danger?: boolean;
}) {
  return (
    <Card className={cn(danger && "border-rose-500/40 bg-rose-500/5") }>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
      {footer === null ? null : <CardFooter className="justify-end border-t border-[color:var(--card-border)] pt-4">{footer}</CardFooter>}
    </Card>
  );
}

export default function SettingsPageClient() {
  const router = useRouter();
  const { workspaceId, userId, authToken, workspaceRole } = useSessionContext();
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const { data, isLoading, isFetching, error, refetch } = useWorkspaceSettingsQuery();
  const updateSettings = useUpdateWorkspaceSettingsMutation();

  const [draft, setDraft] = useState<WorkspaceSettingsDocument | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("general");
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [savingSection, setSavingSection] = useState<WorkspaceSettingsSectionKey | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("member");
  const [memberAction, setMemberAction] = useState<string | null>(null);
  const loadedWorkspaceRef = useRef<string | null>(null);

  const currentSettings = draft ?? data?.settings ?? null;
  const currentWorkspace = data?.workspace ?? null;
  const currentMembership = workspaceRole ?? data?.membership.role ?? null;
  const canManageTeam = currentMembership === "owner" || currentMembership === "admin";
  const sortedMembers = useMemo(() => sortMembers(data?.members ?? []), [data?.members]);
  const dirtySections = useMemo(() => {
    if (!currentSettings || !data) {
      return [];
    }

    return settingSectionKeys.filter((section) => !equalSection(currentSettings[section], data.settings[section]));
  }, [currentSettings, data]);
  const activeMeta = useMemo(() => categories.find((item) => item.id === activeCategory) ?? categories[0], [activeCategory]);
  const activeRoleOptions = getAssignableRoles(currentMembership);
  const roleOptionsForInvite = canManageTeam ? activeRoleOptions : [];
  const visibleBanner = banner;

  useEffect(() => {
    if (!data) {
      return;
    }

    if (loadedWorkspaceRef.current !== data.workspace.id) {
      loadedWorkspaceRef.current = data.workspace.id;
      setDraft(cloneSettings(data.settings));
      setInviteEmail("");
      setInviteRole(canManageTeam ? "member" : "member");
      setBanner(null);
      setTheme(data.settings.general.theme);
    }
  }, [canManageTeam, data, setTheme]);

  const updateSection = <K extends WorkspaceSettingsSectionKey>(
    section: K,
    updater: (current: WorkspaceSettingsDocument[K]) => WorkspaceSettingsDocument[K],
  ) => {
    setDraft((current) => {
      const base = current ?? currentSettings;

      if (!base) {
        return current;
      }

      return {
        ...base,
        [section]: updater(base[section]),
      };
    });
  };

  const saveSection = async <K extends WorkspaceSettingsSectionKey>(
    section: K,
    options?: { silent?: boolean },
  ) => {
    if (!currentSettings) {
      return;
    }

    const sectionData = currentSettings[section];
    setSavingSection(section);

    if (!options?.silent) {
      setBanner(null);
    }

    try {
      const response = await updateSettings.mutateAsync({
        section,
        data: sectionData,
      } as Parameters<typeof updateSettings.mutateAsync>[0]);

      const nextSettings = response.data.settings;
      setDraft((current) => {
        if (!current) {
          return cloneSettings(nextSettings);
        }

        return {
          ...current,
          [section]: nextSettings[section],
        };
      });

      if (section === "general") {
        setTheme(nextSettings.general.theme);
      }

      if (!options?.silent) {
        setBanner({ kind: "success", message: `${sectionLabel(section)} saved.` });
      }

      return response.data;
    } catch (saveError) {
      if (!options?.silent) {
        setBanner({
          kind: "error",
          message: saveError instanceof Error ? saveError.message : `Failed to save ${sectionLabel(section).toLowerCase()}.`,
        });
      }

      throw saveError;
    } finally {
      setSavingSection(null);
    }
  };

  const saveAllChanges = async () => {
    if (!currentSettings) {
      return;
    }

    const sectionsToSave = dirtySections;

    if (sectionsToSave.length === 0) {
      setBanner({ kind: "success", message: "No unsaved changes found." });
      return;
    }

    setSavingAll(true);
    setBanner(null);

    try {
      const snapshot = currentSettings;

      for (const section of sectionsToSave) {
        await saveSection(section, { silent: true });
        setDraft((current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            [section]: snapshot[section],
          };
        });
      }

      setBanner({
        kind: "success",
        message: `Saved ${sectionsToSave.length} section${sectionsToSave.length === 1 ? "" : "s"}.`,
      });
    } catch (saveError) {
      setBanner({
        kind: "error",
        message: saveError instanceof Error ? saveError.message : "Failed to save workspace settings.",
      });
    } finally {
      setSavingAll(false);
    }
  };

  const handleInviteMember = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!workspaceId || !authToken || !canManageTeam) {
      return;
    }

    const email = inviteEmail.trim();

    if (!email) {
      setBanner({ kind: "error", message: "Enter an email address before inviting a teammate." });
      return;
    }

    setMemberAction("invite");
    setBanner(null);

    try {
      const payload = await fetchApiJson<{ data: { user: { email: string } } }>("/api/workspace/members", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify({ email, role: inviteRole }),
      });

      setInviteEmail("");
      setInviteRole("member");
      setBanner({ kind: "success", message: `${payload.data.user.email} now has access to this workspace.` });
      await refetch();
    } catch (inviteError) {
      setBanner({
        kind: "error",
        message: inviteError instanceof Error ? inviteError.message : "Failed to add member.",
      });
    } finally {
      setMemberAction(null);
    }
  };

  const updateMemberRole = async (member: WorkspaceMemberSummary, nextRole: WorkspaceRole) => {
    if (!workspaceId || !authToken || !canManageTeam) {
      return;
    }

    if (member.role === "owner" || member.user.id === userId) {
      return;
    }

    setMemberAction(`role:${member.user.id}`);
    setBanner(null);

    try {
      await fetchApiJson(`/api/workspace/members/${member.user.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        session: { workspaceId, authToken },
        body: JSON.stringify({ role: nextRole }),
      });

      setBanner({ kind: "success", message: `${member.user.email} role updated to ${roleLabel(nextRole)}.` });
      await refetch();
    } catch (updateError) {
      setBanner({
        kind: "error",
        message: updateError instanceof Error ? updateError.message : "Failed to update member role.",
      });
    } finally {
      setMemberAction(null);
    }
  };

  const toggleMemberActive = async (member: WorkspaceMemberSummary) => {
    if (!workspaceId || !authToken || !canManageTeam) {
      return;
    }

    if (member.role === "owner" || member.user.id === userId) {
      return;
    }

    setMemberAction(`status:${member.user.id}`);
    setBanner(null);

    try {
      if (member.isActive) {
        await fetchApiJson(`/api/workspace/members/${member.user.id}`, {
          method: "DELETE",
          session: { workspaceId, authToken },
        });
        setBanner({ kind: "success", message: `${member.user.email} was removed from the workspace.` });
      } else {
        await fetchApiJson(`/api/workspace/members/${member.user.id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          session: { workspaceId, authToken },
          body: JSON.stringify({ isActive: true, role: member.role }),
        });
        setBanner({ kind: "success", message: `${member.user.email} was reactivated.` });
      }

      await refetch();
    } catch (toggleError) {
      setBanner({
        kind: "error",
        message: toggleError instanceof Error ? toggleError.message : "Failed to update member status.",
      });
    } finally {
      setMemberAction(null);
    }
  };

  const handleWorkspaceLogout = async () => {
    try {
      await fetchApiJson("/api/auth/logout", {
        method: "POST",
        session: {},
      });
    } catch {
      // Ignore cookie clearing failures and continue with the client sign-out.
    }

    if (supabase) {
      await supabase.auth.signOut();
    }

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
      window.localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }

    router.replace("/login");
    router.refresh();
  };

  const handleDeleteWorkspace = async () => {
    if (!window.confirm("Delete this workspace? This cannot be undone.")) {
      return;
    }

    if (!workspaceId || !authToken) {
      return;
    }

    setMemberAction("delete-workspace");
    setBanner(null);

    try {
      await fetchApiJson("/api/workspace", {
        method: "DELETE",
        session: { workspaceId, authToken },
      });

      await handleWorkspaceLogout();
    } catch (deleteError) {
      setBanner({
        kind: "error",
        message: deleteError instanceof Error ? deleteError.message : "Failed to delete workspace.",
      });
      setMemberAction(null);
    }
  };

  const handleExportWorkspace = () => {
    if (!currentSettings || !currentWorkspace) {
      return;
    }

    downloadJson(`orbit-${currentWorkspace.slug}-workspace.json`, {
      workspace: currentWorkspace,
      members: data?.members ?? [],
      settings: currentSettings,
      exportedAt: new Date().toISOString(),
    });

    setBanner({ kind: "success", message: "Workspace export downloaded." });
  };

  const handleExportSchema = () => {
    if (!currentSettings || !currentWorkspace) {
      return;
    }

    downloadJson(`orbit-${currentWorkspace.slug}-settings-schema.json`, {
      workspaceId: currentWorkspace.id,
      workspaceSlug: currentWorkspace.slug,
      sectionKeys: settingSectionKeys,
      settings: currentSettings,
      exportedAt: new Date().toISOString(),
    });

    setBanner({ kind: "success", message: "Settings schema export downloaded." });
  };

  const handleWorkspaceColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateSection("appearance", (current) => ({
      ...current,
      workspaceColor: event.target.value,
    }));
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setBanner({ kind: "error", message: "Workspace logo must be 2 MB or smaller." });
      event.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);

      updateSection("general", (current) => ({
        ...current,
        workspaceLogoDataUrl: dataUrl,
      }));
    } catch (logoError) {
      setBanner({
        kind: "error",
        message: logoError instanceof Error ? logoError.message : "Unable to read the selected image.",
      });
    } finally {
      event.target.value = "";
    }
  };

  const renderSaveFooter = (section: WorkspaceSettingsSectionKey, label = `Save ${sectionLabel(section)}`) => {
    const isDirty = dirtySections.includes(section);
    const busy = savingAll || savingSection !== null;

    return (
      <Button
        type="button"
        variant="secondary"
        onClick={() => void saveSection(section)}
        disabled={busy || !isDirty}
      >
        <Save className="h-4 w-4" />
        {savingSection === section ? "Saving..." : label}
      </Button>
    );
  };

  const renderGeneralSection = () => {
    if (!currentSettings) {
      return null;
    }

    const general = currentSettings.general;

    return (
      <SectionCard
        title="General Settings"
        description="Workspace identity, locale and theme defaults."
        footer={renderSaveFooter("general")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Workspace Name">
            <Input
              value={general.workspaceName}
              onChange={(event) =>
                updateSection("general", (current) => ({
                  ...current,
                  workspaceName: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Workspace Icon / Logo" hint="PNG or SVG up to 2 MB.">
            <div className="space-y-3">
              <Input type="file" accept="image/*" onChange={handleLogoUpload} />
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[color:var(--card-border)] bg-[var(--surface-strong)] p-3">
                {general.workspaceLogoDataUrl ? (
                  <img
                    src={general.workspaceLogoDataUrl}
                    alt="Workspace logo preview"
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {general.workspaceLogoDataUrl ? "Workspace logo selected" : "Upload a logo to personalize the workspace."}
                  </p>
                  <p className="text-xs text-[var(--muted)]">The selected image is stored as part of workspace settings.</p>
                </div>
                {general.workspaceLogoDataUrl ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      updateSection("general", (current) => ({
                        ...current,
                        workspaceLogoDataUrl: null,
                      }))
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
            </div>
          </Field>
        </div>

        <Field label="Workspace Description">
          <textarea
            className={textareaClassName}
            value={general.workspaceDescription}
            onChange={(event) =>
              updateSection("general", (current) => ({
                ...current,
                workspaceDescription: event.target.value,
              }))
            }
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Default Time Zone">
            <select
              className={selectClassName}
              value={general.timezone}
              onChange={(event) =>
                updateSection("general", (current) => ({
                  ...current,
                  timezone: event.target.value,
                }))
              }
            >
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Europe/London">Europe/London</option>
            </select>
          </Field>

          <Field label="Date & Time Format">
            <select
              className={selectClassName}
              value={general.dateFormat}
              onChange={(event) =>
                updateSection("general", (current) => ({
                  ...current,
                  dateFormat: event.target.value as WorkspaceSettingsDocument["general"]["dateFormat"],
                }))
              }
            >
              <option value="12h">12h</option>
              <option value="24h">24h</option>
            </select>
          </Field>

          <Field label="Language">
            <select
              className={selectClassName}
              value={general.language}
              onChange={(event) =>
                updateSection("general", (current) => ({
                  ...current,
                  language: event.target.value as WorkspaceSettingsDocument["general"]["language"],
                }))
              }
            >
              <option value="en">English</option>
              <option value="ta">Tamil</option>
              <option value="hi">Hindi</option>
            </select>
          </Field>

          <Field label="Theme">
            <select
              className={selectClassName}
              value={general.theme}
              onChange={(event) => {
                const nextTheme = event.target.value as WorkspaceSettingsDocument["general"]["theme"];
                setTheme(nextTheme);
                updateSection("general", (current) => ({
                  ...current,
                  theme: nextTheme,
                }));
              }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </Field>
        </div>
      </SectionCard>
    );
  };

  const renderTeamSection = () => {
    const inviteRoles = roleOptionsForInvite.length > 0 ? roleOptionsForInvite : (["member"] as const);

    return (
      <SectionCard
        title="Team & Members"
        description="Invite teammates, manage roles and member lifecycle."
        footer={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void refetch()} disabled={isFetching}>
              <RefreshCw className="h-4 w-4" />
              Refresh Members
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/admin")}>
              Open Admin Panel
            </Button>
          </div>
        }
      >
        <div className="space-y-3 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">Invite Member</p>
              <p className="text-xs text-[var(--muted)]">Add an existing Orbit account to this workspace.</p>
            </div>
            <Badge variant={canManageTeam ? "success" : "warning"}>{canManageTeam ? "Editable" : "Read only"}</Badge>
          </div>

          <form className="grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_auto]" onSubmit={handleInviteMember}>
            <Input
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              disabled={!canManageTeam || memberAction === "invite"}
            />
            <select
              className={selectClassName}
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value as WorkspaceRole)}
              disabled={!canManageTeam || memberAction === "invite"}
            >
              {inviteRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={!canManageTeam || memberAction === "invite"}>
              {memberAction === "invite" ? "Inviting..." : "Invite Member"}
            </Button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[color:var(--card-border)]">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[var(--surface-strong)] text-[var(--muted)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map((member) => {
                const isSelf = member.user.id === userId;
                const isOwner = member.role === "owner";
                const isBusy = memberAction === `role:${member.user.id}` || memberAction === `status:${member.user.id}`;
                const canEditRow = canManageTeam && !isOwner && !isSelf;
                const roleOptions = member.role === "owner" ? (["owner"] as const) : inviteRoles;

                return (
                  <tr key={member.user.id} className="border-t border-[color:var(--card-border)]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-[var(--surface)] text-[var(--foreground)]">{memberInitials(member)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-[var(--foreground)]">
                              {member.user.fullName?.trim() || member.user.email}
                            </p>
                            <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
                            {isSelf ? <Badge variant="default">You</Badge> : null}
                          </div>
                          <p className="text-xs text-[var(--muted)]">{member.user.jobTitle || "Team member"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">{member.user.email}</td>
                    <td className="px-4 py-4">
                      <select
                        className={selectClassName}
                        value={member.role}
                        onChange={(event) => void updateMemberRole(member, event.target.value as WorkspaceRole)}
                        disabled={!canEditRow || isBusy}
                      >
                        {roleOptions.map((role) => (
                          <option key={role} value={role}>
                            {roleLabel(role)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-[var(--muted)]">{formatJoinedAt(member.joinedAt)}</td>
                    <td className="px-4 py-4">
                      <Badge variant={member.isActive ? "success" : "warning"}>
                        {member.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void toggleMemberActive(member)}
                        disabled={!canEditRow || isBusy}
                      >
                        <UserMinus className="h-4 w-4" />
                        {member.isActive ? "Deactivate" : "Reactivate"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[color:var(--card-border)] px-6 py-10 text-center text-sm text-[var(--muted)]">
            No members have been added to this workspace yet.
          </div>
        ) : null}
      </SectionCard>
    );
  };

  const renderNotificationsSection = () => {
    if (!currentSettings) {
      return null;
    }

    const notifications = currentSettings.notifications;

    return (
      <SectionCard
        title="Notifications"
        description="Control what, where and when notifications are sent."
        footer={renderSaveFooter("notifications")}
      >
        <div className="space-y-2">
          <ToggleRow
            title="Task assigned to me"
            description="Email me when I am assigned a task."
            checked={notifications.taskAssigned}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, taskAssigned: checked }))}
          />
          <ToggleRow
            title="Task due soon / overdue"
            description="Send deadline reminders by email."
            checked={notifications.taskDueSoon}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, taskDueSoon: checked }))}
          />
          <ToggleRow
            title="Mentioned in comments"
            description="Notify me when tagged in discussion."
            checked={notifications.mentionedInComments}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, mentionedInComments: checked }))}
          />
          <ToggleRow
            title="Idea converted to task"
            description="Email when idea enters execution."
            checked={notifications.ideaConverted}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, ideaConverted: checked }))}
          />
          <ToggleRow
            title="Weekly digest"
            description="Send weekly summary report."
            checked={notifications.weeklyDigest}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, weeklyDigest: checked }))}
          />
          <ToggleRow
            title="In-App Notifications"
            description="Enable in-app feed notifications."
            checked={notifications.inApp}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, inApp: checked }))}
          />
          <ToggleRow
            title="Push Notifications"
            description="Enable mobile and PWA push alerts."
            checked={notifications.push}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, push: checked }))}
          />
          <ToggleRow
            title="Slack Integration"
            description="Route notification summaries to Slack."
            checked={notifications.slack}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, slack: checked }))}
          />
          <ToggleRow
            title="WhatsApp Integration"
            description="Route notification summaries to WhatsApp."
            checked={notifications.whatsapp}
            onChange={(checked) => updateSection("notifications", (current) => ({ ...current, whatsapp: checked }))}
          />
        </div>
      </SectionCard>
    );
  };

  const renderTasksSection = () => {
    if (!currentSettings) {
      return null;
    }

    const tasks = currentSettings.tasks;

    return (
      <SectionCard title="Tasks & Workflow" description="Default task behavior and automation rules." footer={renderSaveFooter("tasks")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Default Task View">
            <select
              className={selectClassName}
              value={tasks.defaultTaskView}
              onChange={(event) =>
                updateSection("tasks", (current) => ({
                  ...current,
                  defaultTaskView: event.target.value as WorkspaceSettingsDocument["tasks"]["defaultTaskView"],
                }))
              }
            >
              <option value="kanban">Kanban</option>
              <option value="list">List</option>
              <option value="calendar">Calendar</option>
            </select>
          </Field>
          <Field label="Default Priority Levels">
            <Input
              value={tasks.defaultPriorityLevels}
              onChange={(event) => updateSection("tasks", (current) => ({ ...current, defaultPriorityLevels: event.target.value }))}
            />
          </Field>
          <Field label="Task Statuses">
            <Input value={tasks.taskStatuses} onChange={(event) => updateSection("tasks", (current) => ({ ...current, taskStatuses: event.target.value }))} />
          </Field>
        </div>
        <Field label="Recurring Task Templates">
          <Input
            value={tasks.recurringTaskTemplates}
            onChange={(event) => updateSection("tasks", (current) => ({ ...current, recurringTaskTemplates: event.target.value }))}
          />
        </Field>
        <ToggleRow
          title="When task completed -> notify manager"
          description="Send automatic completion notification."
          checked={tasks.notifyWhenCompleted}
          onChange={(checked) => updateSection("tasks", (current) => ({ ...current, notifyWhenCompleted: checked }))}
        />
        <ToggleRow
          title="When task overdue -> send reminder"
          description="Send reminder to assignee and owner."
          checked={tasks.notifyWhenOverdue}
          onChange={(checked) => updateSection("tasks", (current) => ({ ...current, notifyWhenOverdue: checked }))}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            title="Enable billable hours"
            description="Allow billable flag for tracked time."
            checked={tasks.enableBillableHours}
            onChange={(checked) => updateSection("tasks", (current) => ({ ...current, enableBillableHours: checked }))}
          />
          <Field label="Default estimate unit">
            <select
              className={selectClassName}
              value={tasks.defaultEstimateUnit}
              onChange={(event) =>
                updateSection("tasks", (current) => ({
                  ...current,
                  defaultEstimateUnit: event.target.value as WorkspaceSettingsDocument["tasks"]["defaultEstimateUnit"],
                }))
              }
            >
              <option value="hours">Hours</option>
              <option value="days">Days</option>
            </select>
          </Field>
        </div>
      </SectionCard>
    );
  };

  const renderCalendarSection = () => {
    if (!currentSettings) {
      return null;
    }

    const calendar = currentSettings.calendar;

    return (
      <SectionCard title="Calendar & Time" description="Working schedule, leave and sync defaults." footer={renderSaveFooter("calendar")}>
        <div className="space-y-2 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-3">
          {dayOrder.map((day) => (
            <div key={day} className="grid items-center gap-2 md:grid-cols-[72px_1fr_1fr]">
              <span className="text-sm text-[var(--muted)]">{day}</span>
              <Input
                type="time"
                value={calendar.workingHours[day].start}
                onChange={(event) =>
                  updateSection("calendar", (current) => ({
                    ...current,
                    workingHours: {
                      ...current.workingHours,
                      [day]: {
                        ...current.workingHours[day],
                        start: event.target.value,
                      },
                    },
                  }))
                }
              />
              <Input
                type="time"
                value={calendar.workingHours[day].end}
                onChange={(event) =>
                  updateSection("calendar", (current) => ({
                    ...current,
                    workingHours: {
                      ...current.workingHours,
                      [day]: {
                        ...current.workingHours[day],
                        end: event.target.value,
                      },
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
        <ToggleRow
          title="Weekend Settings"
          description="Hide weekends in calendar views."
          checked={calendar.weekendHidden}
          onChange={(checked) => updateSection("calendar", (current) => ({ ...current, weekendHidden: checked }))}
        />
        <Field label="Time Off / Leave Types">
          <Input value={calendar.timeOffTypes} onChange={(event) => updateSection("calendar", (current) => ({ ...current, timeOffTypes: event.target.value }))} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <ToggleRow
            title="Google Calendar Sync"
            description="Connect and sync events."
            checked={calendar.googleCalendarSync}
            onChange={(checked) => updateSection("calendar", (current) => ({ ...current, googleCalendarSync: checked }))}
          />
          <Field label="Default Event Duration">
            <select
              className={selectClassName}
              value={calendar.defaultEventDuration}
              onChange={(event) =>
                updateSection("calendar", (current) => ({
                  ...current,
                  defaultEventDuration: event.target.value as WorkspaceSettingsDocument["calendar"]["defaultEventDuration"],
                }))
              }
            >
              <option value="30">30 min</option>
              <option value="60">60 min</option>
            </select>
          </Field>
        </div>
      </SectionCard>
    );
  };

  const renderReportsSection = () => {
    if (!currentSettings) {
      return null;
    }

    const reports = currentSettings.reports;

    return (
      <SectionCard title="Reports & Analytics" description="Reporting defaults and dashboard widgets." footer={renderSaveFooter("reports")}>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Default Report Period">
            <select
              className={selectClassName}
              value={reports.defaultReportPeriod}
              onChange={(event) =>
                updateSection("reports", (current) => ({
                  ...current,
                  defaultReportPeriod: event.target.value as WorkspaceSettingsDocument["reports"]["defaultReportPeriod"],
                }))
              }
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Export Format">
            <Input value={reports.exportFormat} onChange={(event) => updateSection("reports", (current) => ({ ...current, exportFormat: event.target.value }))} />
          </Field>
          <ToggleRow
            title="Show sensitive data for admins"
            description="Sensitive fields remain visible to trusted roles."
            checked={reports.showSensitiveData}
            onChange={(checked) => updateSection("reports", (current) => ({ ...current, showSensitiveData: checked }))}
          />
        </div>
        <Field label="Dashboard Widget Preferences">
          <Input
            value={reports.dashboardWidgetPreferences}
            onChange={(event) => updateSection("reports", (current) => ({ ...current, dashboardWidgetPreferences: event.target.value }))}
          />
        </Field>
      </SectionCard>
    );
  };

  const renderIntegrationsSection = () => {
    if (!currentSettings) {
      return null;
    }

    const integrations = currentSettings.integrations;

    const integrationRows: Array<{
      key: keyof WorkspaceSettingsDocument["integrations"];
      label: string;
      description: string;
    }> = [
      { key: "googleCalendar", label: "Google Calendar", description: "Sync events with your calendar." },
      { key: "slack", label: "Slack", description: "Route alerts and summaries to Slack." },
      { key: "googleDrive", label: "Google Drive", description: "Store exports and attachments." },
      { key: "zapier", label: "Zapier / Make.com", description: "Trigger automations with webhooks." },
      { key: "whatsappBusiness", label: "WhatsApp Business", description: "Send quick notification summaries." },
    ];

    return (
      <SectionCard title="Integrations" description="External tools and automation providers." footer={renderSaveFooter("integrations")}>
        <div className="space-y-2">
          {integrationRows.map((row) => {
            const isConnected = integrations[row.key] === "connected";

            return (
              <div
                key={row.key}
                className="flex flex-col gap-3 rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">{row.label}</p>
                  <p className="text-xs text-[var(--muted)]">{row.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={isConnected ? "success" : "warning"}>{isConnected ? "Connected" : "Disconnected"}</Badge>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      updateSection("integrations", (current) => ({
                        ...current,
                        [row.key]: isConnected ? "disconnected" : "connected",
                      }))
                    }
                  >
                    {isConnected ? "Disconnect" : "Connect"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    );
  };

  const renderSecuritySection = () => {
    if (!currentSettings) {
      return null;
    }

    const security = currentSettings.security;

    return (
      <div className="space-y-4">
        <SectionCard title="Security & Billing" description="Account security, sessions, data and plans." footer={renderSaveFooter("security")}>
          <ToggleRow
            title="Two-Factor Authentication"
            description="Allow users to enable 2FA."
            checked={security.twoFactorAuthentication}
            onChange={(checked) => updateSection("security", (current) => ({ ...current, twoFactorAuthentication: checked }))}
          />

          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] p-4">
            <p className="text-sm font-medium text-[var(--foreground)]">Session Management</p>
            <p className="text-xs text-[var(--muted)]">Clear the current browser session and sign out of the workspace.</p>
            <Button type="button" variant="secondary" className="mt-3" onClick={() => void handleWorkspaceLogout()}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Button type="button" variant="secondary" onClick={handleExportWorkspace}>
              <Download className="h-4 w-4" />
              Data Export
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.location.assign("mailto:billing@orbit.app?subject=Orbit%20billing")}
            >
              Billing & Plans
            </Button>
          </div>
        </SectionCard>

        <SectionCard
          title="Danger Zone"
          description="Permanent workspace deletion action."
          footer={
            <Button type="button" variant="secondary" className="border-rose-500/40 text-rose-200 hover:bg-rose-500/10" onClick={() => void handleDeleteWorkspace()}>
              <Trash2 className="h-4 w-4" />
              Delete Workspace
            </Button>
          }
          danger
        >
          <p className="text-sm text-rose-200">
            Deleting the workspace will remove all tasks, ideas, members and history. This cannot be undone.
          </p>
        </SectionCard>
      </div>
    );
  };

  const renderAppearanceSection = () => {
    if (!currentSettings) {
      return null;
    }

    const appearance = currentSettings.appearance;

    return (
      <SectionCard title="Appearance & Customization" description="Visual behavior and productivity preferences." footer={renderSaveFooter("appearance")}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Custom Workspace Color">
            <Input type="color" value={appearance.workspaceColor} onChange={handleWorkspaceColorChange} className="h-11 px-1" />
          </Field>
          <Field label="Sidebar Density">
            <select
              className={selectClassName}
              value={appearance.sidebarDensity}
              onChange={(event) =>
                updateSection("appearance", (current) => ({
                  ...current,
                  sidebarDensity: event.target.value as WorkspaceSettingsDocument["appearance"]["sidebarDensity"],
                }))
              }
            >
              <option value="compact">Compact</option>
              <option value="normal">Normal</option>
            </select>
          </Field>
          <ToggleRow
            title="Show Activity Feed"
            description="Display feed on dashboard."
            checked={appearance.showActivityFeed}
            onChange={(checked) => updateSection("appearance", (current) => ({ ...current, showActivityFeed: checked }))}
          />
          <Field label="Command Palette Shortcuts">
            <Input
              value={appearance.commandPaletteShortcuts}
              onChange={(event) => updateSection("appearance", (current) => ({ ...current, commandPaletteShortcuts: event.target.value }))}
            />
          </Field>
        </div>
      </SectionCard>
    );
  };

  const renderAdvancedSection = () => {
    if (!currentSettings) {
      return null;
    }

    const advanced = currentSettings.advanced;

    return (
      <SectionCard title="Advanced / Developer" description="Programmatic and audit-level controls." footer={renderSaveFooter("advanced")}>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <Input readOnly value={advanced.apiKey} />
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              updateSection("advanced", (current) => ({
                ...current,
                apiKey: generateSecret("pf_api_live"),
              }))
            }
          >
            Generate
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              updateSection("advanced", (current) => ({
                ...current,
                apiKey: generateSecret("pf_api_revoked"),
              }))
            }
          >
            Revoke
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Webhook URL"
            value={advanced.webhookUrl}
            onChange={(event) => updateSection("advanced", (current) => ({ ...current, webhookUrl: event.target.value }))}
          />
          <Input
            placeholder="Webhook secret"
            value={advanced.webhookSecret}
            onChange={(event) => updateSection("advanced", (current) => ({ ...current, webhookSecret: event.target.value }))}
          />
        </div>

        <Field label="Audit Log">
          <textarea className={textareaClassName} readOnly value={advanced.auditLog} />
        </Field>

        <Button type="button" variant="secondary" onClick={handleExportSchema}>
          <Sparkles className="h-4 w-4" />
          Export Schema
        </Button>
      </SectionCard>
    );
  };

  const renderActiveSection = () => {
    if (activeCategory === "general") return renderGeneralSection();
    if (activeCategory === "team") return renderTeamSection();
    if (activeCategory === "notifications") return renderNotificationsSection();
    if (activeCategory === "tasks") return renderTasksSection();
    if (activeCategory === "calendar") return renderCalendarSection();
    if (activeCategory === "reports") return renderReportsSection();
    if (activeCategory === "integrations") return renderIntegrationsSection();
    if (activeCategory === "security") return renderSecuritySection();
    if (activeCategory === "appearance") return renderAppearanceSection();
    return renderAdvancedSection();
  };

  if (isLoading || (!data && !error)) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-8 text-center text-[var(--muted)]">
        Loading workspace settings...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center p-8">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Settings unavailable</CardTitle>
            <CardDescription>{error instanceof Error ? error.message : "Unable to load workspace settings."}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-end">
            <Button onClick={() => void refetch()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentSettings || !currentWorkspace) {
    return null;
  }

  return (
    <div className="space-y-6 page-animate">
      <section className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Settings</p>
            <div className="flex items-center gap-3">
              <Settings2 className="h-7 w-7 text-[var(--accent)]" />
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">Workspace control center</h1>
            </div>
            <p className="max-w-2xl text-sm text-[var(--muted)]">
              Manage workspace defaults, members and production-ready operational settings for {currentWorkspace.name}.
            </p>
            {visibleBanner ? (
              <div
                className={cn(
                  "rounded-2xl border px-4 py-3 text-sm",
                  visibleBanner.kind === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-200",
                )}
              >
                {visibleBanner.message}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Role</p>
              <p className="mt-1 font-medium text-[var(--foreground)]">{roleLabel(currentMembership)}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Workspace</p>
              <p className="mt-1 font-medium text-[var(--foreground)]">{currentWorkspace.slug}</p>
            </div>
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[var(--surface-strong)] px-4 py-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Dirty sections</p>
              <p className="mt-1 font-medium text-[var(--foreground)]">{dirtySections.length}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-[color:var(--card-border)] bg-[var(--surface)] p-2">
          <div className="space-y-1">
            {categories.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeCategory;
              const sectionKey = item.id as WorkspaceSettingsSectionKey | null;
              const hasChanges = sectionKey ? dirtySections.includes(sectionKey) : false;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveCategory(item.id)}
                  className={cn(
                    "w-full rounded-2xl border border-transparent px-3 py-3 text-left transition-colors",
                    isActive
                      ? "border-[color:var(--card-border)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:border-[color:var(--card-border)] hover:bg-[var(--surface-strong)] hover:text-[var(--foreground)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <p className="text-sm font-medium">{item.label}</p>
                    </div>
                    {hasChanges ? <span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> : null}
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.description}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <activeMeta.icon className="h-5 w-5 text-[var(--accent)]" />
                <CardTitle>{activeMeta.label}</CardTitle>
              </div>
              <CardDescription>{activeMeta.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--muted)]">
              <p>
                {savingAll || savingSection ? "Saving changes..." : isFetching ? "Refreshing data..." : "Changes are saved section by section."}
              </p>
              <Button
                type="button"
                onClick={() => void saveAllChanges()}
                disabled={dirtySections.length === 0 || savingAll || savingSection !== null}
              >
                <Save className="h-4 w-4" />
                {savingAll ? "Saving..." : `Save All Changes${dirtySections.length > 0 ? ` (${dirtySections.length})` : ""}`}
              </Button>
            </CardContent>
          </Card>

          {renderActiveSection()}
        </section>
      </div>
    </div>
  );
}
