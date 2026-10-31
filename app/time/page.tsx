"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from "date-fns";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, Play, Plus, Send, Square, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeEntry {
  id: string;
  taskId: string | null;
  taskTitle?: string | null;
  durationMinutes: number;
  date: string; // YYYY-MM-DD
  notes: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtSeconds(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TimePage() {
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTaskId, setTimerTaskId] = useState<string | null>(null);
  const [timerNotes, setTimerNotes] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    taskId: "", date: format(new Date(), "yyyy-MM-dd"),
    hours: 0, minutes: 30, notes: "",
  });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Current week range
  const baseDate = addWeeks(new Date(), weekOffset);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(baseDate,   { weekStartsOn: 1 });
  const days      = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const from      = format(weekStart, "yyyy-MM-dd");
  const to        = format(weekEnd,   "yyyy-MM-dd");

  // Load entries for this week
  const { data: entries = [], isLoading } = useQuery<TimeEntry[]>({
    queryKey: ["time-entries", from, to],
    queryFn: async () => {
      const res = await apiFetch(`/api/time/entries?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Failed to load time entries");
      return (await res.json()).entries;
    },
  });

  // Load tasks for the select dropdown
  const { data: tasks = [] } = useQuery<Array<{ id: string; title: string }>>({
    queryKey: ["tasks-simple"],
    queryFn: async () => {
      const res = await apiFetch("/api/tasks");
      if (!res.ok) throw new Error();
      return (await res.json()).tasks;
    },
  });

  // Timer tick
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  // Create mutation
  const { mutate: createEntry } = useMutation({
    mutationFn: (data: { taskId: string | null; durationMinutes: number; date: string; notes: string | null }) =>
      apiFetch("/api/time/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
      toast.success("Time logged");
    },
  });

  // Delete mutation
  const { mutate: deleteEntry } = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/time/entries/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["time-entries"] }),
    onError: () => toast.error("Failed to delete entry"),
  });

  // Stop timer → save entry
  function stopTimer() {
    if (timerSeconds < 60) {
      toast.warning("Minimum log time is 1 minute");
      setTimerRunning(false);
      setTimerSeconds(0);
      return;
    }
    createEntry({
      taskId: timerTaskId || null,
      durationMinutes: Math.floor(timerSeconds / 60),
      date: format(new Date(), "yyyy-MM-dd"),
      notes: timerNotes || null,
    });
    setTimerRunning(false);
    setTimerSeconds(0);
    setTimerNotes("");
    setTimerTaskId(null);
  }

  // Manual log submit
  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const mins = manualForm.hours * 60 + manualForm.minutes;
    if (mins < 1) { toast.error("Duration must be at least 1 minute"); return; }
    createEntry({
      taskId: manualForm.taskId || null,
      durationMinutes: mins,
      date: manualForm.date,
      notes: manualForm.notes || null,
    });
    setShowManualForm(false);
    setManualForm({ taskId: "", date: format(new Date(), "yyyy-MM-dd"), hours: 0, minutes: 30, notes: "" });
  }

  // Compute totals
  const totalMins = entries.reduce((s, e) => s + e.durationMinutes, 0);
  const entriesByDate = Object.fromEntries(
    days.map((d) => [
      format(d, "yyyy-MM-dd"),
      entries.filter((e) => e.date === format(d, "yyyy-MM-dd")),
    ])
  );

  // Timesheet submission state
  const [timesheetSubmitted, setTimesheetSubmitted] = useState(false);

  function exportCsv() {
    const headers = "Date,Task,DurationMinutes,Notes\n";
    const rows = entries.map((e) => `"${e.date}","${e.taskTitle || "General"}","${e.durationMinutes}","${e.notes || ""}"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheet-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Timesheet CSV exported");
  }

  function handleSubmitTimesheet() {
    setTimesheetSubmitted(true);
    toast.success("Weekly timesheet submitted for manager approval");
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">Time Tracking & Timesheets</h1>
            {timesheetSubmitted ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-500">
                <CheckCircle2 size={12} /> Submitted
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-muted-foreground">
                Draft
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Week total: <strong>{fmtMinutes(totalMins)}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            type="button"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-accent transition-colors"
            title="Export CSV"
          >
            <Download size={13} /> Export CSV
          </button>
          {!timesheetSubmitted && (
            <button
              onClick={handleSubmitTimesheet}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-primary/30 bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
            >
              <Send size={13} /> Submit Timesheet
            </button>
          )}
          <button
            onClick={() => setShowManualForm(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Log time
          </button>
        </div>
      </div>

      {/* Live Timer */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="text-xs text-muted-foreground font-medium mb-3">
          Live timer
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="font-mono text-3xl font-medium tabular-nums min-w-[100px]">
            {fmtSeconds(timerSeconds)}
          </div>
          <select
            value={timerTaskId ?? ""}
            onChange={(e) => setTimerTaskId(e.target.value || null)}
            disabled={timerRunning}
            className="flex-1 min-w-[180px] px-3 py-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none"
          >
            <option value="">No linked task</option>
            {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
          {timerRunning && (
            <input
              value={timerNotes}
              onChange={(e) => setTimerNotes(e.target.value)}
              placeholder="What are you working on?"
              className="flex-1 min-w-[180px] px-3 py-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none"
            />
          )}
          {timerRunning ? (
            <button
              onClick={stopTimer}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white text-sm hover:bg-red-600 transition-colors"
            >
              <Square size={14} fill="white" /> Stop &amp; log
            </button>
          ) : (
            <button
              onClick={() => setTimerRunning(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition-colors"
            >
              <Play size={14} fill="white" /> Start
            </button>
          )}
        </div>
      </div>

      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setWeekOffset((w) => w - 1)} className="p-1.5 rounded-md hover:bg-muted transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium">
          {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          {weekOffset === 0 && <span className="ml-2 text-xs text-muted-foreground">(this week)</span>}
        </span>
        <button onClick={() => setWeekOffset((w) => w + 1)} disabled={weekOffset >= 0} className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-30">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Daily breakdown */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-14 rounded-lg bg-muted" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEntries = entriesByDate[key] ?? [];
            const dayTotal = dayEntries.reduce((s, e) => s + e.durationMinutes, 0);
            const isToday = key === format(new Date(), "yyyy-MM-dd");
            return (
              <div key={key} className={`rounded-xl border ${isToday ? "border-primary/40 bg-primary/5" : "border-border bg-card"} overflow-hidden`}>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                      {format(day, "EEE, MMM d")}
                    </span>
                    {isToday && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Today</span>}
                  </div>
                  <span className="text-sm text-muted-foreground font-medium flex items-center gap-1">
                    <Clock size={12} />
                    {dayTotal > 0 ? fmtMinutes(dayTotal) : "—"}
                  </span>
                </div>
                {dayEntries.length > 0 && (
                  <div className="border-t border-border/50 divide-y divide-border/50">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 px-4 py-2 group">
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono min-w-[48px] text-center">
                          {fmtMinutes(entry.durationMinutes)}
                        </span>
                        <span className="flex-1 text-sm text-muted-foreground truncate">
                          {entry.taskTitle ?? entry.notes ?? "No description"}
                        </span>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Manual log form modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border rounded-xl p-5 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-semibold mb-4">Log time manually</h2>
            <form onSubmit={submitManual} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Task (optional)</label>
                <select value={manualForm.taskId} onChange={(e) => setManualForm((f) => ({ ...f, taskId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none">
                  <option value="">No linked task</option>
                  {tasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input type="date" value={manualForm.date} onChange={(e) => setManualForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Hours</label>
                  <input type="number" min={0} max={23} value={manualForm.hours}
                    onChange={(e) => setManualForm((f) => ({ ...f, hours: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Minutes</label>
                  <input type="number" min={0} max={59} value={manualForm.minutes}
                    onChange={(e) => setManualForm((f) => ({ ...f, minutes: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <input value={manualForm.notes} onChange={(e) => setManualForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="What did you work on?"
                  className="w-full px-3 py-2 rounded-md bg-muted/50 border border-border text-sm focus:outline-none" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowManualForm(false)}
                  className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Log time</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
