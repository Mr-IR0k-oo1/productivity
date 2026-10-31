"use client";

import { useState } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Plus,
  Search,
  Target,
  Workflow,
  Zap,
} from "lucide-react";

export function WorkspaceSection() {
  const [quickInput, setQuickInput] = useState("");
  const [tasks, setTasks] = useState([
    { id: 1, title: "Review sprint 14 burndown & carryover items", done: true, priority: "High" },
    { id: 2, title: "Update authentication tokens with SHA-256 rotation", done: false, priority: "High" },
    { id: 3, title: "Plan sprint 15 backlog items with team", done: false, priority: "Medium" },
    { id: 4, title: "Export monthly engineering velocity report", done: false, priority: "Low" },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setTasks([{ id: Date.now(), title: quickInput, done: false, priority: "Medium" }, ...tasks]);
    setQuickInput("");
  };

  return (
    <section id="workspace" className="scroll-mt-20 border-t border-white/[0.08] bg-[#0d0e15] py-24 lg:py-32 text-white">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">
            04 — Unified Environment
          </span>
          <h2 className="font-display text-[clamp(2.2rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-[-0.04em]">
            One workspace. Your entire workflow.
          </h2>
          <p className="text-base md:text-lg text-[#a1a1aa] leading-relaxed">
            Experience how your day actually feels inside ORBIT. From morning planning to afternoon sprint delivery, everything communicates in real time.
          </p>
        </div>

        {/* Live Interactive Workspace Demo */}
        <div className="mt-14 overflow-hidden rounded-3xl border border-white/10 bg-[#09090b] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.8)]">
          {/* Top Window Bar */}
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#12131a] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
              <span className="ml-3 text-xs font-mono text-[#a1a1aa]">ORBIT Workspace — Primary Flight Deck</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#a1a1aa]">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Real-time Sync Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px]">
            {/* Sidebar Navigation */}
            <div className="border-r border-white/[0.08] bg-[#0c0d14] p-4 hidden lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#71717a] px-2 mb-3">Navigation</p>
              <ul className="space-y-1 text-xs font-medium">
                <li className="flex items-center gap-2.5 rounded-lg bg-[#8b5cf6]/20 px-3 py-2 text-white ring-1 ring-[#8b5cf6]/30">
                  <LayoutDashboard className="h-4 w-4 text-[#8b5cf6]" />
                  <span>Dashboard</span>
                </li>
                <li className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white">
                  <ListTodo className="h-4 w-4" />
                  <span>Backlog</span>
                </li>
                <li className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white">
                  <Zap className="h-4 w-4" />
                  <span>Sprint 14</span>
                </li>
                <li className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white">
                  <Calendar className="h-4 w-4" />
                  <span>Calendar</span>
                </li>
                <li className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white">
                  <Lightbulb className="h-4 w-4" />
                  <span>Ideas</span>
                </li>
                <li className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[#a1a1aa] hover:bg-white/[0.04] hover:text-white">
                  <Workflow className="h-4 w-4" />
                  <span>Flowcharts</span>
                </li>
              </ul>

              <div className="mt-8 border-t border-white/[0.08] pt-4 px-2">
                <div className="flex items-center justify-between text-xs text-[#a1a1aa] mb-2">
                  <span>Sprint Goal</span>
                  <span className="font-semibold text-white">72%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#8b5cf6] to-[#ff8a3d] w-[72%]" />
                </div>
              </div>
            </div>

            {/* Center: Live Today's Tasks & Quick Capture */}
            <div className="p-6 space-y-6">
              {/* Quick Capture Form */}
              <form onSubmit={handleAdd} className="flex gap-2">
                <div className="relative flex-1">
                  <Plus className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#71717a]" />
                  <input
                    type="text"
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="Quick capture a task or idea (press Enter)..."
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#14141c] pl-9 pr-4 text-xs sm:text-sm text-white placeholder-[#71717a] outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6]"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-[#8b5cf6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7c3aed]"
                >
                  Add
                </button>
              </form>

              {/* Task List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">Today&apos;s Deliverables</h3>
                  <span className="text-xs text-[#a1a1aa] font-mono">{tasks.filter((t) => t.done).length}/{tasks.length} done</span>
                </div>

                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3.5 transition-all ${
                        task.done
                          ? "border-white/[0.04] bg-white/[0.02] text-[#71717a]"
                          : "border-white/10 bg-[#14141c] text-white hover:border-white/20 hover:bg-[#181824]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            task.done
                              ? "border-[#8b5cf6] bg-[#8b5cf6] text-white"
                              : "border-white/20 bg-white/[0.04]"
                          }`}
                        >
                          {task.done && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                        <span className={`text-xs sm:text-sm truncate font-medium ${task.done ? "line-through" : ""}`}>
                          {task.title}
                        </span>
                      </div>

                      <span
                        className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          task.priority === "High"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : task.priority === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Upcoming & Goal Progress */}
            <div className="border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#0c0d14] p-5 space-y-6">
              <div>
                <p className="text-xs font-semibold text-white mb-3">Next 48 Hours</p>
                <div className="space-y-2.5 text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-[#14141c] p-3">
                    <p className="font-semibold text-white">Sprint 14 Demo</p>
                    <p className="text-[11px] text-[#a1a1aa] mt-0.5">Tomorrow at 2:00 PM</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-[#14141c] p-3">
                    <p className="font-semibold text-white">Architecture Review</p>
                    <p className="text-[11px] text-[#a1a1aa] mt-0.5">Thursday at 10:30 AM</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-[#14141c] p-4">
                <p className="text-xs font-semibold text-white">Quarterly Objective</p>
                <p className="text-[11px] text-[#a1a1aa] mt-1">Self-serve billing rollout</p>
                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#8b5cf6]">19 / 24 issues</span>
                  <span className="text-white font-semibold">79%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#8b5cf6] w-[79%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
