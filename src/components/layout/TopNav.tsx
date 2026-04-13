"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoonStar, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navTabs = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ideas", label: "Ideas" },
  { href: "/tasks", label: "Tasks" },
  { href: "/calendar", label: "Calendar" },
  { href: "/time", label: "Time" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

interface TopNavProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function TopNav({ collapsed, onToggleCollapse }: TopNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-white/10 bg-[#0a0a0a]/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-9 w-9 border border-white/10 bg-[#111111] text-white hover:bg-[#1a1a1a]"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
        <Link href="/dashboard" className="text-base font-semibold tracking-tight text-white">
          PulseForge
        </Link>
      </div>

      <nav className="ml-6 hidden items-center gap-1 lg:flex">
        {navTabs.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-[#1b1b1b] text-white" : "text-neutral-400 hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="ml-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 border border-white/10 bg-[#111111] text-neutral-300 hover:bg-[#1a1a1a] hover:text-white"
          aria-label="Theme toggle"
        >
          <MoonStar className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
