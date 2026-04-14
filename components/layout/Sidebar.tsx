"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Lightbulb,
  CheckSquare,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  ChevronLeft,
  Search,
  Command,
  Bell,
} from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Ideas", href: "/ideas", icon: Lightbulb },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Time", href: "/time", icon: Clock },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={`hidden h-screen border-r border-gray-800 bg-[#0a0a0a] transition-all duration-300 md:flex md:flex-col ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex items-center justify-between border-b border-gray-800 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <span className="text-xl font-bold text-white">P</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">PulseForge</h1>
            </div>
          )}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          aria-label="Collapse"
          title="Collapse"
          type="button"
        >
          <ChevronLeft className={`h-5 w-5 transition-transform ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={isCollapsed ? "" : "Search..."}
            className="w-full rounded-xl border border-gray-700 bg-[#121212] py-3 pl-11 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
          {!isCollapsed && (
            <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-1 text-xs text-gray-500">
              <Command className="h-3 w-3" />K
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group mx-2 mb-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
              {!isCollapsed && <span className="font-medium">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-gray-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-700 text-lg font-medium">U</div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium">User</p>
                <p className="text-xs text-gray-500">you@example.com</p>
              </div>
            )}
          </div>

          <button
            className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            type="button"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
