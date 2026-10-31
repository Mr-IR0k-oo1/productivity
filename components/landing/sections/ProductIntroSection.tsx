"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CheckSquare,
  Clock,
  Layers,
  Lightbulb,
  Sparkles,
  Target,
  Workflow,
  Zap,
} from "lucide-react";
import { BacklogVignette, BoardVignette, FlowVignette, IdeasVignette, ReportsVignette } from "@/components/landing/vignettes";

const modules = [
  {
    id: "tasks",
    name: "Tasks",
    tagline: "Capture and execute work",
    icon: CheckSquare,
    badge: "Kanban & Lists",
    description: "Manage daily deliverables across Kanban, list, calendar, and Gantt views with priorities, subtasks, and instant filters.",
    preview: <BoardVignette />,
    points: ["Drag-and-drop Kanban workflow", "Priorities: High, Medium, Low", "Subtasks with automatic progress tracking"],
  },
  {
    id: "projects",
    name: "Projects & Sprints",
    tagline: "Organize larger initiatives",
    icon: Zap,
    badge: "Agile Sprints",
    description: "Group tasks into epics, estimate with story points, and run time-boxed sprints that track velocity and carry over work.",
    preview: <BacklogVignette />,
    points: ["Epics and story points estimation", "Time-boxed sprint cadences", "Burndown velocity metrics"],
  },
  {
    id: "calendar",
    name: "Calendar",
    tagline: "Plan time and commitments",
    icon: CalendarDays,
    badge: "Time Blocking",
    description: "Align your deadlines, meetings, and deep work blocks on a synchronized schedule that exports cleanly.",
    preview: <ReportsVignette />,
    points: ["Due dates mapped to tasks", "Focus blocks for deep work", "External calendar export"],
  },
  {
    id: "notes",
    name: "Notes & Ideas",
    tagline: "Store ideas and knowledge",
    icon: Lightbulb,
    badge: "Idea Voting",
    description: "Capture sparks of inspiration from anyone on the team, collect peer upvotes, and turn the best ideas directly into tasks.",
    preview: <IdeasVignette />,
    points: ["Community voting and discussions", "Rich text and code block notes", "One-click conversion to backlog issues"],
  },
  {
    id: "goals",
    name: "Goals & Flowcharts",
    tagline: "Track long-term progress",
    icon: Target,
    badge: "Visual Whiteboard",
    description: "Map architecture, logic branches, and user flows on an infinite canvas with live issue cards linked directly to nodes.",
    preview: <FlowVignette />,
    points: ["Interactive infinite whiteboard canvas", "System architecture & user flows", "Live issue card embedding"],
  },
];

export function ProductIntroSection() {
  const [activeTab, setActiveTab] = useState("tasks");
  const current = modules.find((m) => m.id === activeTab) || modules[0];
  const CurrentIcon = current.icon;

  return (
    <section id="modules" className="relative scroll-mt-20 border-t border-white/[0.08] bg-[#09090b] py-24 lg:py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">
            03 — Product Architecture
          </span>
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            Everything connected. Nothing scattered.
          </h2>
          <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
            Bring your daily workflow into one connected environment. Five core modules built to replace five separate subscriptions.
          </p>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-full border border-white/[0.08] bg-[#14141c]/80 backdrop-blur-xl max-w-3xl mx-auto">
          {modules.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-[#8b5cf6] text-white shadow-[0_0_24px_rgba(139,92,246,0.5)] scale-[1.02]"
                    : "text-[#a1a1aa] hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Feature Spotlight Display */}
        <div className="relative mt-12 overflow-hidden rounded-3xl border border-white/10 bg-[#14141c]/60 p-6 sm:p-10 backdrop-blur-2xl shadow-2xl">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-[#8b5cf6]/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative grid gap-10 lg:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b5cf6]/20 text-[#8b5cf6] ring-1 ring-[#8b5cf6]/30 shadow-md">
                  <CurrentIcon className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#8b5cf6] uppercase tracking-wider">{current.tagline}</span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">{current.name}</h3>
                </div>
              </div>

              <p className="text-base text-[#a1a1aa] leading-relaxed">
                {current.description}
              </p>

              <ul className="space-y-3 pt-2">
                {current.points.map((point) => (
                  <li key={point} className="flex items-center gap-3 text-sm text-white font-medium">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              {current.preview}
            </div>
          </div>
        </div>

        {/* 5-Card Module Overview Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {modules.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`group text-left rounded-2xl border p-4 transition-all ${
                  isActive
                    ? "border-[#8b5cf6] bg-[#181826] shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                    : "border-white/[0.08] bg-[#14141c]/50 hover:border-white/20 hover:bg-[#181824]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-5 w-5 ${isActive ? "text-[#8b5cf6]" : "text-[#a1a1aa] group-hover:text-white"}`} />
                  <span className="text-[10px] font-mono text-[#71717a]">{item.badge}</span>
                </div>
                <p className="mt-3 text-xs font-bold text-white">{item.name}</p>
                <p className="mt-1 text-[11px] text-[#a1a1aa] truncate">{item.tagline}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
