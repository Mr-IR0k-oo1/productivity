"use client";

import { useEffect, useState, useTransition } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ChevronDown, ChevronsUpDown, Building2, Plus, Sparkles, X, ShieldAlert } from "lucide-react";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { WORKSPACE_STORAGE_KEY } from "@/lib/auth/session";
import { fetchApiJson } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type WorkspaceItem = {
  id: string;
  name: string;
  slug: string;
};

interface WorkspaceSwitcherProps {
  isCollapsed?: boolean;
}

export function WorkspaceSwitcher({ isCollapsed = false }: WorkspaceSwitcherProps) {
  const { workspaceId, authToken, workspaceRole, setWorkspaceId } = useSessionContext();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadWorkspaces = async () => {
    if (!authToken) return;
    try {
      setLoading(true);
      const res = await fetchApiJson<{ data: WorkspaceItem[] }>("/api/workspace", {
        session: { authToken },
      });
      setWorkspaces(res.data ?? []);
    } catch {
      // Fallback workspace if in local/offline state
      if (!workspaces.length) {
        setWorkspaces([
          {
            id: workspaceId || "default",
            name: "Default Workspace",
            slug: "default",
          },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [authToken, workspaceId]);

  const currentWorkspace =
    workspaces.find((w) => w.id === workspaceId) ||
    workspaces[0] || {
      id: workspaceId || "default",
      name: "Acme Corp",
      slug: "acme",
    };

  const handleSelect = (selectedId: string) => {
    setWorkspaceId(selectedId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, selectedId);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreateError(null);
    startTransition(async () => {
      try {
        const payload = await fetchApiJson<{ data: WorkspaceItem }>("/api/workspace", {
          method: "POST",
          session: { authToken },
          body: JSON.stringify({
            name: newOrgName.trim(),
            slug: newOrgSlug.trim() || undefined,
          }),
        });

        if (payload?.data) {
          setWorkspaces((prev) => [...prev, payload.data]);
          handleSelect(payload.data.id);
          setCreateModalOpen(false);
          setNewOrgName("");
          setNewOrgSlug("");
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to create workspace";
        setCreateError(message);
      }
    });
  };

  const roleBadge =
    workspaceRole === "owner" ? "Owner" : workspaceRole === "admin" ? "Admin" : "Member";

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className={cn(
              "group flex items-center gap-2.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-1.5 text-left transition-all hover:border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)] focus:outline-hidden focus:ring-1 focus:ring-[var(--color-accent)]",
              isCollapsed ? "justify-center w-10 h-10 mx-auto" : "w-full px-2.5 py-2",
            )}
            title={currentWorkspace.name}
          >
            {/* Org Icon / Monogram */}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-subtle)] text-xs font-semibold text-white shadow-xs">
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </div>

            {!isCollapsed && (
              <>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-xs font-semibold tracking-tight text-[var(--color-text-primary)]">
                      {currentWorkspace.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
                    {roleBadge}
                  </span>
                </div>
                <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)]" />
              </>
            )}
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className="z-50 min-w-[220px] max-w-[260px] rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-1.5 shadow-xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95"
          >
            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Workspaces & Orgs
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5">
              {workspaces.map((ws) => {
                const isSelected = ws.id === currentWorkspace.id;
                return (
                  <DropdownMenu.Item
                    key={ws.id}
                    onSelect={() => handleSelect(ws.id)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium cursor-pointer outline-hidden transition-colors",
                      isSelected
                        ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)] font-semibold"
                        : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-[var(--color-surface-hover)] text-[10px] font-bold">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{ws.name}</span>
                    </div>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </DropdownMenu.Item>
                );
              })}
            </div>

            <DropdownMenu.Separator className="my-1.5 h-px bg-[var(--color-border-secondary)]" />

            <DropdownMenu.Item
              onSelect={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] cursor-pointer outline-hidden"
            >
              <Plus className="h-3.5 w-3.5 text-[var(--color-accent)]" />
              <span>Create Workspace</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Create Workspace Modal */}
      <Dialog.Root open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <Building2 className="h-4 w-4" />
                </div>
                <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                  Create New Workspace
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
              Add a dedicated workspace for your company, business unit, or squad. You can invite team members once created.
            </Dialog.Description>

            {createError && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-500">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Orbit Labs"
                  value={newOrgName}
                  onChange={(e) => {
                    setNewOrgName(e.target.value);
                    if (!newOrgSlug || newOrgSlug === newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                    }
                  }}
                  className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-3 py-2 text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Workspace Identifier / Slug
                </label>
                <div className="flex items-center rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-3 py-2 text-xs text-[var(--color-text-primary)]">
                  <span className="text-[var(--color-text-tertiary)] mr-1">orbit.app/</span>
                  <input
                    type="text"
                    placeholder="orbit-labs"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    className="w-full bg-transparent outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--color-border-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
                  >
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  type="submit"
                  disabled={isPending || !newOrgName.trim()}
                  className="rounded-lg bg-[var(--color-accent)] px-4 py-1.5 text-xs font-medium text-white shadow-xs hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
