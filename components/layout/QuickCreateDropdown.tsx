"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Plus,
  CheckSquare,
  FolderPlus,
  Lightbulb,
  Calendar,
  FileText,
  Target,
  UserPlus,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function QuickCreateDropdown() {
  const router = useRouter();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-2.5 text-xs font-medium text-white shadow-xs transition-all hover:opacity-90 active:scale-95 focus:outline-hidden"
          title="Quick Create"
          aria-label="Quick create item"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">New</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[190px] rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-1.5 shadow-xl backdrop-blur-2xl animate-in fade-in-50 zoom-in-95"
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Quick Actions
          </div>

          <DropdownMenu.Item
            onSelect={() => router.push("/tasks?new=true")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] cursor-pointer outline-hidden"
          >
            <CheckSquare className="h-4 w-4 text-emerald-500" />
            <span>Create Task</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => router.push("/projects?new=true")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] cursor-pointer outline-hidden"
          >
            <FolderPlus className="h-4 w-4 text-blue-500" />
            <span>New Project</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => router.push("/goals?new=true")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] cursor-pointer outline-hidden"
          >
            <Target className="h-4 w-4 text-rose-500" />
            <span>New Objective</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => router.push("/docs?new=true")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] cursor-pointer outline-hidden"
          >
            <FileText className="h-4 w-4 text-teal-500" />
            <span>New Document</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => router.push("/ideas")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] cursor-pointer outline-hidden"
          >
            <Lightbulb className="h-4 w-4 text-amber-500" />
            <span>Submit Idea</span>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            onSelect={() => router.push("/calendar")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] cursor-pointer outline-hidden"
          >
            <Calendar className="h-4 w-4 text-purple-500" />
            <span>Schedule Event</span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border-secondary)]" />

          <DropdownMenu.Item
            onSelect={() => router.push("/teams?invite=true")}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)] cursor-pointer outline-hidden"
          >
            <UserPlus className="h-4 w-4 text-[var(--color-accent)]" />
            <span>Invite Teammate</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
