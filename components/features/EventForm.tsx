"use client";

import { useState } from "react";
import type { CalendarEventDTO, CreateCalendarEventPayload, EventKind } from "@/hooks/useCalendar";

const KIND_OPTIONS: { value: EventKind; label: string }[] = [
  { value: "meeting", label: "Meeting" },
  { value: "focus", label: "Focus block" },
  { value: "deadline", label: "Deadline" },
  { value: "review", label: "Review" },
  { value: "travel", label: "Travel" },
];

interface EventFormProps {
  initial?: Partial<CalendarEventDTO>;
  projects?: Array<{ id: string; name: string }>;
  tasks?: Array<{ id: string; title: string }>;
  onSubmit: (data: CreateCalendarEventPayload) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function EventForm({
  initial,
  projects = [],
  tasks = [],
  onSubmit,
  onCancel,
  isSubmitting,
}: EventFormProps) {
  // Initialize form with current values or defaults
  const now = new Date();
  const later = new Date(now.getTime() + 3600_000); // 1 hour later

  const [form, setForm] = useState<CreateCalendarEventPayload>({
    title: initial?.title ?? "",
    description: initial?.description ?? null,
    startsAt: initial?.startsAt ?? now.toISOString(),
    endsAt: initial?.endsAt ?? later.toISOString(),
    kind: initial?.kind ?? "meeting",
    project: initial?.project ?? null,
    taskId: initial?.taskId ?? null,
    location: initial?.location ?? null,
  });

  const set = <K extends keyof CreateCalendarEventPayload>(
    key: K,
    value: CreateCalendarEventPayload[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    onSubmit({
      title: form.title.trim(),
      description: form.description || null,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      kind: form.kind || null,
      project: form.project || null,
      taskId: form.taskId || null,
      location: (form.location as string)?.trim() || null,
    });
  };

  // Format datetime-local input value
  const formatDatetimeLocal = (isoString: string) => {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toISOString().slice(0, 16);
    } catch {
      return "";
    }
  };

  // Parse datetime-local input
  const parseDatetimeLocal = (value: string) => {
    if (!value) return "";
    return new Date(value).toISOString();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          required
          type="text"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Event title"
          className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>

      {/* Kind */}
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          value={form.kind ?? ""}
          onChange={(e) => set("kind", (e.target.value as EventKind) || null)}
          className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          <option value="">Select type</option>
          {KIND_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Start + End times */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">Start *</label>
          <input
            required
            type="datetime-local"
            value={formatDatetimeLocal(form.startsAt)}
            onChange={(e) => set("startsAt", parseDatetimeLocal(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">End *</label>
          <input
            required
            type="datetime-local"
            value={formatDatetimeLocal(form.endsAt)}
            onChange={(e) => set("endsAt", parseDatetimeLocal(e.target.value))}
            className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={(form.location as string) ?? ""}
          onChange={(e) => set("location", e.target.value)}
          placeholder="Location, address, or video link"
          className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>

      {/* Linked project */}
      <div>
        <label className="block text-sm font-medium mb-1">Project context</label>
        <input
          type="text"
          value={(form.project as string) ?? ""}
          onChange={(e) => set("project", e.target.value)}
          placeholder="Project name or context"
          className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>

      {/* Linked task */}
      {tasks.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Linked task</label>
          <select
            value={form.taskId ?? ""}
            onChange={(e) => set("taskId", e.target.value || null)}
            className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          >
            <option value="">None</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Description/Notes */}
      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          rows={3}
          value={(form.description as string) ?? ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Optional notes or agenda"
          className="w-full px-3 py-2 rounded-md bg-[var(--color-surface-hover)] border border-[var(--color-border-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm rounded-md border border-[var(--color-border-tertiary)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !form.title.trim()}
          className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? "Saving…" : initial?.id ? "Update event" : "Create event"}
        </button>
      </div>
    </form>
  );
}
