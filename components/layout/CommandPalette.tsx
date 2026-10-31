"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Command } from "cmdk";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BarChart3,
  Calendar,
  CheckSquare,
  Clock,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Search,
  Settings,
  SunMedium,
  User,
  Workflow,
} from "lucide-react";

import { IssueTypeIcon } from "@/components/features/BacklogWorkspace";
import { useSessionContext } from "@/components/providers/SessionProvider";
import type { IssueType } from "@/hooks/useTasks";
import { fetchApiJson } from "@/lib/api/client";
import { useUIStore } from "@/stores/ui-store";

type SearchResults = {
  issues: Array<{ id: string; key: string | null; title: string; issueType: IssueType; status: string }>;
  ideas: Array<{ id: string; title: string; status: string }>;
  flowcharts: Array<{ id: string; title: string }>;
};

const pages = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Day", href: "/my-day", icon: SunMedium },
  { label: "Backlog", href: "/backlog", icon: ListTodo },
  { label: "Tasks", href: "/tasks", icon: CheckSquare },
  { label: "Ideas", href: "/ideas", icon: Lightbulb },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Flowcharts", href: "/flowcharts", icon: Workflow },
  { label: "Time", href: "/time", icon: Clock },
  { label: "Reports", href: "/reports", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Profile", href: "/profile", icon: User },
];

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

const itemClass =
  "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-[var(--color-text-primary)] aria-selected:bg-[var(--color-accent-soft)]";
const groupClass =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-[var(--color-text-tertiary)]";

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((state) => state.searchOpen);
  const setOpen = useUIStore((state) => state.setSearchOpen);
  const { workspaceId, authToken, userId, isReady } = useSessionContext();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 200);

  const results = useQuery({
    queryKey: ["search", workspaceId, debouncedQuery],
    queryFn: async () =>
      (
        await fetchApiJson<{ data: SearchResults }>(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
          session: { workspaceId, authToken },
        })
      ).data,
    enabled: open && isReady && Boolean(userId) && debouncedQuery.length > 0,
    staleTime: 10_000,
  });

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const data = results.data;
  const hasResults = Boolean(data && (data.issues.length || data.ideas.length || data.flowcharts.length));

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (setOpen(next), next || setQuery(""))}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[15vh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] shadow-2xl"
        >
          <Dialog.Title className="sr-only">Search Orbit</Dialog.Title>
          {/* Server results are already filtered, so cmdk's own filtering only applies to pages. */}
          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-2 border-b border-[var(--color-border-secondary)] px-4">
              <Search className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search issues, ideas, flowcharts, or jump to a page…"
                className="h-12 w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
              />
            </div>
            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              {debouncedQuery && results.isFetching && !data ? (
                <Command.Loading>
                  <p className="px-3 py-6 text-center text-sm text-[var(--color-text-tertiary)]">Searching…</p>
                </Command.Loading>
              ) : null}

              {results.isError ? (
                <p className="px-3 py-6 text-center text-sm text-red-400">Search failed. Check your connection and try again.</p>
              ) : null}

              {debouncedQuery && data && !hasResults ? (
                <p className="px-3 py-6 text-center text-sm text-[var(--color-text-tertiary)]">No matches for “{debouncedQuery}”.</p>
              ) : null}

              {data?.issues.length ? (
                <Command.Group heading="Issues" className={groupClass}>
                  {data.issues.map((issue) => (
                    <Command.Item key={issue.id} value={`issue-${issue.id}`} onSelect={() => go(`/tasks?taskId=${issue.id}`)} className={itemClass}>
                      <IssueTypeIcon type={issue.issueType} />
                      <span className="w-16 shrink-0 font-mono text-xs text-[var(--color-text-tertiary)]">{issue.key}</span>
                      <span className="truncate">{issue.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              {data?.ideas.length ? (
                <Command.Group heading="Ideas" className={groupClass}>
                  {data.ideas.map((idea) => (
                    <Command.Item key={idea.id} value={`idea-${idea.id}`} onSelect={() => go(`/ideas?ideaId=${idea.id}`)} className={itemClass}>
                      <Lightbulb className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
                      <span className="truncate">{idea.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              {data?.flowcharts.length ? (
                <Command.Group heading="Flowcharts" className={groupClass}>
                  {data.flowcharts.map((flowchart) => (
                    <Command.Item key={flowchart.id} value={`flowchart-${flowchart.id}`} onSelect={() => go(`/flowcharts/${flowchart.id}`)} className={itemClass}>
                      <Workflow className="h-4 w-4 shrink-0 text-sky-400" aria-hidden="true" />
                      <span className="truncate">{flowchart.title}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}

              <Command.Group heading="Go to" className={groupClass}>
                {pages
                  .filter((page) => !debouncedQuery || page.label.toLowerCase().includes(debouncedQuery.toLowerCase()))
                  .map(({ label, href, icon: Icon }) => (
                    <Command.Item key={href} value={`page-${href}`} onSelect={() => go(href)} className={itemClass}>
                      <Icon className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
                      {label}
                    </Command.Item>
                  ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
