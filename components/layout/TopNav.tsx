"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useUIStore } from "@/stores/ui-store";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Ideas", href: "/ideas" },
  { label: "Tasks", href: "/tasks" },
  { label: "Flowcharts", href: "/flowcharts" },
  { label: "Calendar", href: "/calendar" },
  { label: "Time", href: "/time" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const theme = useUIStore((state) => state.theme);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              theme === "dark" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-100"
            )}>
              <Flame className="h-4 w-4" />
            </span>
            <span className={cn(
              "text-lg font-bold tracking-tight",
              theme === "dark" ? "text-zinc-100" : "text-zinc-900"
            )}>Orbit</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <ThemeToggle variant="icon" />
        </div>
      </div>
    </header>
  );
}