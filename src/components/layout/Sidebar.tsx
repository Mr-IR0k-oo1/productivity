"use client";

import { Bell, Command, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-white/10 bg-[#0d0d0d] p-3 md:flex md:flex-col md:gap-3 transition-[width] duration-200",
        collapsed ? "md:w-20" : "md:w-72",
      )}
    >
      <Button
        variant="ghost"
        onClick={onToggleCollapse}
        className={cn(
          "h-10 border border-white/10 bg-[#111111] text-neutral-200 hover:bg-[#191919]",
          collapsed ? "justify-center px-0" : "justify-start px-3",
        )}
      >
        {collapsed ? "C" : "Collapse"}
      </Button>

      <div className={cn("space-y-3", collapsed && "space-y-2")}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            placeholder={collapsed ? "" : "Search"}
            aria-label="Search"
            className={cn(
              "h-10 border-white/10 bg-[#111111] text-sm text-neutral-100 placeholder:text-neutral-500",
              collapsed ? "px-0 text-center" : "pl-9",
            )}
          />
        </div>

        <Button
          variant="ghost"
          className={cn(
            "h-10 border border-white/10 bg-[#111111] text-neutral-200 hover:bg-[#191919]",
            collapsed ? "justify-center px-0" : "justify-between px-3",
          )}
        >
          <span className="flex items-center gap-2">
            <Command className="h-4 w-4" />
            {!collapsed && <span className="text-sm">Command</span>}
          </span>
          {!collapsed && <span className="rounded border border-white/10 px-1.5 py-0.5 text-[11px] text-neutral-400">⌘K</span>}
        </Button>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 border border-white/10 bg-[#111111] text-neutral-300 hover:bg-[#191919]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Avatar className="h-10 w-10 border border-white/10 bg-[#111111]">
          <AvatarFallback className="bg-[#111111] text-sm font-semibold text-neutral-200">U</AvatarFallback>
        </Avatar>
      </div>
    </aside>
  );
}
