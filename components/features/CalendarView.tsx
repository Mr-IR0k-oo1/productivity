"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  Link2,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CalendarViewMode = "month" | "week" | "day" | "agenda";
type EventKind = "meeting" | "focus" | "deadline" | "review" | "travel";

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  kind: EventKind;
  project: string;
  owner: string;
  location: string;
  notes: string;
  attendees: string[];
  chipClassName: string;
  dotClassName: string;
};

const initialDate = new Date("2026-04-14T09:00:00");

const eventKinds: Record<EventKind, { label: string; className: string }> = {
  meeting: { label: "Meeting", className: "border-blue-900 bg-blue-950/60 text-blue-200" },
  focus: { label: "Focus", className: "border-emerald-900 bg-emerald-950/60 text-emerald-200" },
  deadline: { label: "Deadline", className: "border-amber-900 bg-amber-950/60 text-amber-200" },
  review: { label: "Review", className: "border-zinc-800 bg-zinc-900 text-zinc-200" },
  travel: { label: "Travel", className: "border-violet-900 bg-violet-950/60 text-violet-200" },
};

const sourceFilters = [
  { label: "Team calendar", color: "bg-blue-400" },
  { label: "Product milestones", color: "bg-emerald-400" },
  { label: "1:1s and reviews", color: "bg-amber-400" },
  { label: "Deadlines", color: "bg-rose-400" },
];

const teamAvailability = [
  { name: "Alice", role: "Owner", status: "In focus" },
  { name: "Bala", role: "Admin", status: "In review" },
  { name: "Chitra", role: "Design", status: "Available" },
  { name: "Dev", role: "Engineering", status: "Away" },
];

const quickActions = ["Create event", "Schedule 1:1", "Block focus time", "Sync calendars"];

const sampleEvents: CalendarEvent[] = [
  {
    id: "ev-1",
    title: "Founder standup",
    start: new Date("2026-04-14T09:00:00"),
    end: new Date("2026-04-14T09:30:00"),
    kind: "meeting",
    project: "PulseForge Core",
    owner: "Alice",
    location: "Zoom",
    notes: "Review blockers, calendar sync, and support queue for the week.",
    attendees: ["AK", "BM", "CR"],
    chipClassName: eventKinds.meeting.className,
    dotClassName: "bg-blue-500",
  },
  {
    id: "ev-2",
    title: "Product deep work block",
    start: new Date("2026-04-14T10:00:00"),
    end: new Date("2026-04-14T12:00:00"),
    kind: "focus",
    project: "Dashboard v2",
    owner: "Bala",
    location: "Workspace",
    notes: "No meetings. Ship the dashboard layout, stats cards, and export panel.",
    attendees: ["BM"],
    chipClassName: eventKinds.focus.className,
    dotClassName: "bg-emerald-500",
  },
  {
    id: "ev-3",
    title: "Design review",
    start: new Date("2026-04-14T13:00:00"),
    end: new Date("2026-04-14T13:45:00"),
    kind: "review",
    project: "Calendar workspace",
    owner: "Chitra",
    location: "Figma",
    notes: "Validate spacing, event density, and the modal detail experience.",
    attendees: ["CR", "AK"],
    chipClassName: eventKinds.review.className,
    dotClassName: "bg-zinc-400",
  },
  {
    id: "ev-4",
    title: "Billing API deadline",
    start: new Date("2026-04-15T16:00:00"),
    end: new Date("2026-04-15T17:00:00"),
    kind: "deadline",
    project: "Payments",
    owner: "Dev",
    location: "Launch board",
    notes: "Hard deadline for the retry logic rollout and QA handoff.",
    attendees: ["DS"],
    chipClassName: eventKinds.deadline.className,
    dotClassName: "bg-amber-500",
  },
  {
    id: "ev-5",
    title: "Customer call: Northwind",
    start: new Date("2026-04-16T15:30:00"),
    end: new Date("2026-04-16T16:15:00"),
    kind: "meeting",
    project: "Growth",
    owner: "Alice",
    location: "Google Meet",
    notes: "Discuss roadmap, onboarding, and calendar integration feedback.",
    attendees: ["AK", "NW"],
    chipClassName: eventKinds.meeting.className,
    dotClassName: "bg-blue-500",
  },
  {
    id: "ev-6",
    title: "Travel to client site",
    start: new Date("2026-04-18T08:00:00"),
    end: new Date("2026-04-18T10:30:00"),
    kind: "travel",
    project: "Field ops",
    owner: "Dev",
    location: "Hyderabad",
    notes: "Travel block for onsite workshop and stakeholder interview.",
    attendees: ["DS"],
    chipClassName: eventKinds.travel.className,
    dotClassName: "bg-violet-500",
  },
  {
    id: "ev-7",
    title: "Sprint planning",
    start: new Date("2026-04-21T11:00:00"),
    end: new Date("2026-04-21T12:00:00"),
    kind: "meeting",
    project: "Platform",
    owner: "Bala",
    location: "Conference room",
    notes: "Prioritize calendar, reports, and time-tracking follow-ups.",
    attendees: ["BM", "CR", "DS"],
    chipClassName: eventKinds.meeting.className,
    dotClassName: "bg-blue-500",
  },
];

function minutesBetween(start: Date, end: Date) {
  return Math.max(15, Math.round((end.getTime() - start.getTime()) / 60000));
}

function eventTimeLabel(event: CalendarEvent) {
  return `${format(event.start, "h:mm a")} - ${format(event.end, "h:mm a")}`;
}

function getDayEvents(events: CalendarEvent[], day: Date) {
  return events.filter((event) => isSameDay(event.start, day));
}

function getVisibleHoursForDay(day: Date, events: CalendarEvent[]) {
  const dayEvents = getDayEvents(events, day);
  const startHour = Math.min(8, ...dayEvents.map((event) => event.start.getHours()));
  const endHour = Math.max(18, ...dayEvents.map((event) => event.end.getHours() + 1));
  return Array.from({ length: endHour - startHour + 1 }, (_, index) => startHour + index);
}

function CalendarChip({ event, onClick }: { event: CalendarEvent; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-lg border px-3 py-2 text-left transition-all hover:-translate-y-0.5 hover:border-zinc-700",
        event.chipClassName,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{event.title}</p>
          <p className="mt-1 text-xs text-zinc-400">{eventTimeLabel(event)}</p>
        </div>
        <span className={cn("mt-0.5 h-2.5 w-2.5 rounded-full", event.dotClassName)} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">{event.project}</p>
    </button>
  );
}

function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-900 p-6">
          <div>
            <Badge variant={event.kind === "deadline" ? "warning" : event.kind === "focus" ? "success" : "default"}>
              {eventKinds[event.kind].label}
            </Badge>
            <h2 className="mt-3 text-2xl font-semibold text-zinc-100">{event.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{event.project}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="space-y-4">
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Time</p>
                  <p className="mt-1 text-sm text-zinc-200">{eventTimeLabel(event)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Owner</p>
                  <p className="mt-1 text-sm text-zinc-200">{event.owner}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Location</p>
                  <p className="mt-1 text-sm text-zinc-200">{event.location}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500">Duration</p>
                  <p className="mt-1 text-sm text-zinc-200">{minutesBetween(event.start, event.end)} minutes</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Notes</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{event.notes}</p>
            </div>

            <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Attendees</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {event.attendees.map((attendee) => (
                  <Badge key={attendee} variant="default">
                    {attendee}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="secondary">
                  <Link2 className="h-4 w-4" />
                  Copy event link
                </Button>
                <Button className="w-full justify-start" variant="secondary">
                  <CalendarDays className="h-4 w-4" />
                  Reschedule
                </Button>
                <Button className="w-full justify-start" variant="secondary">
                  <Download className="h-4 w-4" />
                  Export .ics
                </Button>
              </CardContent>
            </Card>

            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Sync status</span>
                  <span className="text-emerald-400">Linked</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Kind</span>
                  <span className="text-zinc-200">{eventKinds[event.kind].label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Source</span>
                  <span className="text-zinc-200">PulseForge</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarView() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [viewDate, setViewDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EventKind | "all">("all");
  const [showMyOnly, setShowMyOnly] = useState(false);

  const visibleEvents = useMemo(() => {
    return sampleEvents.filter((event) => {
      const matchesSearch =
        search.trim().length === 0 ||
        [event.title, event.project, event.owner, event.location].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        );
      const matchesType = typeFilter === "all" || event.kind === typeFilter;
      const matchesOwner = showMyOnly ? event.owner === "Alice" : true;
      return matchesSearch && matchesType && matchesOwner;
    });
  }, [search, typeFilter, showMyOnly]);

  const monthStart = startOfMonth(viewDate);
  const monthDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 });
    const days: Date[] = [];
    let current = start;

    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }

    return days;
  }, [monthStart]);

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const selectedDayEvents = getDayEvents(visibleEvents, selectedDate);
  const weekEvents = visibleEvents.filter((event) => weekDays.some((day) => isSameDay(event.start, day)));
  const agendaEvents = [...visibleEvents].sort((a, b) => a.start.getTime() - b.start.getTime());

  const miniMonthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 });
    const days: Date[] = [];
    let current = start;

    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }

    return days;
  }, [viewDate]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <Card className="border-zinc-900 bg-zinc-950/60">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Calendar</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-100">Team schedule</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Month, week, day, and agenda views for meetings, deadlines, focus blocks, and travel.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => setViewDate(subMonths(viewDate, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={() => setViewDate(initialDate)}>
                Today
              </Button>
              <Button variant="secondary" onClick={() => setViewDate(addMonths(viewDate, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => setSelectedEvent(sampleEvents[0])}>
                <Plus className="h-4 w-4" />
                New event
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/60">
          <CardContent className="flex flex-wrap items-center gap-3 p-4 md:p-6">
            <div className="flex flex-1 flex-wrap items-center gap-2">
              {(["month", "week", "day", "agenda"] as CalendarViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm capitalize transition-colors",
                    viewMode === mode
                      ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                      : "border-zinc-900 bg-zinc-950 text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="grid w-full gap-3 md:w-auto md:min-w-[280px] md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search events, projects, owners"
                  className="pl-9"
                />
              </div>
              <Button variant="secondary">
                <Filter className="h-4 w-4" />
                Filters
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as EventKind | "all")}
                className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
              >
                <option value="all">All types</option>
                <option value="meeting">Meeting</option>
                <option value="focus">Focus</option>
                <option value="deadline">Deadline</option>
                <option value="review">Review</option>
                <option value="travel">Travel</option>
              </select>
              <label className="flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={showMyOnly}
                  onChange={(event) => setShowMyOnly(event.target.checked)}
                />
                My items
              </label>
              <Button variant="secondary">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {viewMode === "month" ? (
          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl">{format(viewDate, "MMMM yyyy")}</CardTitle>
                  <p className="mt-1 text-sm text-zinc-400">Monthly overview with event density and focus blocks.</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Drag-ready blocks and modal details
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <div className="grid grid-cols-7 gap-2 text-xs uppercase tracking-wide text-zinc-500">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="px-2 pb-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day) => {
                  const dayEvents = getDayEvents(visibleEvents, day);
                  const active = isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "min-h-[150px] rounded-xl border p-3 text-left transition-colors",
                        active ? "border-zinc-700 bg-zinc-900/80" : "border-zinc-900 bg-zinc-950/40 hover:border-zinc-700",
                        !isSameMonth(day, monthStart) && "opacity-45",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full text-sm",
                            isToday(day) ? "bg-zinc-100 text-zinc-900" : "text-zinc-200",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayEvents.length > 0 ? (
                          <span className="text-xs text-zinc-500">{dayEvents.length} items</span>
                        ) : null}
                      </div>

                      <div className="mt-3 space-y-2">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            role="button"
                            tabIndex={0}
                            onClick={(clickEvent) => {
                              clickEvent.stopPropagation();
                              setSelectedEvent(event);
                            }}
                            onKeyDown={(keyEvent) => {
                              if (keyEvent.key === "Enter" || keyEvent.key === " ") {
                                keyEvent.preventDefault();
                                setSelectedEvent(event);
                              }
                            }}
                            className={cn(
                              "cursor-grab rounded-md border px-2 py-1.5 text-xs transition-transform hover:-translate-y-0.5",
                              event.chipClassName,
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{event.title}</span>
                              <span className="text-[10px] opacity-80">{format(event.start, "h:mm a")}</span>
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 ? <p className="text-xs text-zinc-500">+{dayEvents.length - 3} more</p> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {viewMode === "week" ? (
          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-xl">Week of {format(weekStart, "MMM d")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 md:p-6">
              <div className="grid gap-2 lg:grid-cols-7">
                {weekDays.map((day) => (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "rounded-xl border p-3 text-left transition-colors",
                      isSameDay(day, selectedDate)
                        ? "border-zinc-700 bg-zinc-900/80"
                        : "border-zinc-900 bg-zinc-950/40 hover:border-zinc-700",
                    )}
                  >
                    <p className="text-sm font-medium text-zinc-100">{format(day, "EEE")}</p>
                    <p className="mt-1 text-xs text-zinc-500">{format(day, "MMM d")}</p>
                    <p className="mt-3 text-lg font-semibold text-zinc-100">{getDayEvents(visibleEvents, day).length} events</p>
                  </button>
                ))}
              </div>

              <div className="grid gap-3">
                {weekEvents.map((event) => (
                  <div key={event.id} className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-zinc-100">{event.title}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          {format(event.start, "EEE, MMM d")} • {eventTimeLabel(event)}
                        </p>
                      </div>
                      <Button variant="secondary" onClick={() => setSelectedEvent(event)}>
                        View details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {viewMode === "day" ? (
          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-xl">{format(selectedDate, "EEEE, MMMM d")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 md:p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <div className="space-y-3 rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
                <p className="text-sm font-medium text-zinc-200">Selected day</p>
                <p className="text-3xl font-semibold text-zinc-100">{selectedDayEvents.length}</p>
                <p className="text-sm text-zinc-400">events scheduled</p>
                <div className="pt-2">
                  <div className="space-y-2 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Clock3 className="h-4 w-4 text-zinc-500" />
                      {format(selectedDate, "h:mm a")}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-zinc-500" />
                      {selectedDayEvents[0]?.location ?? "No location yet"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-500" />
                      {selectedDayEvents[0]?.attendees.length ?? 0} attendees
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event) => (
                    <CalendarChip key={event.id} event={event} onClick={() => setSelectedEvent(event)} />
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-sm text-zinc-500">
                    No events for this day.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}

        {viewMode === "agenda" ? (
          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="border-b border-zinc-900 pb-4">
              <CardTitle className="text-xl">Agenda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 md:p-6">
              {agendaEvents.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => setSelectedEvent(event)}
                  className="flex w-full items-center gap-4 rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 text-left transition-colors hover:border-zinc-700"
                >
                  <div className={cn("h-10 w-10 rounded-full", event.dotClassName)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-zinc-100">{event.title}</p>
                      <Badge
                        variant={event.kind === "deadline" ? "warning" : event.kind === "focus" ? "success" : "default"}
                      >
                        {eventKinds[event.kind].label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {format(event.start, "EEE, MMM d")} • {eventTimeLabel(event)} • {event.project}
                    </p>
                  </div>
                  <MoreHorizontal className="h-4 w-4 text-zinc-500" />
                </button>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      <aside className="space-y-4">
        <Card className="border-zinc-900 bg-zinc-950/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Mini month</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-7 gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
              {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                <div key={day} className="text-center">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {miniMonthDays.map((day) => (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-xs transition-colors",
                    isSameDay(day, selectedDate)
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                    !isSameMonth(day, viewDate) && "opacity-35",
                  )}
                >
                  {format(day, "d")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Team availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamAvailability.map((member) => (
              <div key={member.name} className="flex items-center gap-3 rounded-lg border border-zinc-900 bg-zinc-950/50 p-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-200">{member.name}</p>
                  <p className="text-xs text-zinc-500">{member.role}</p>
                </div>
                <Badge variant={member.status === "Available" ? "success" : member.status === "Away" ? "warning" : "default"}>
                  {member.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-zinc-900 bg-zinc-950/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Event summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Selected date</span>
              <span className="text-zinc-100">{format(selectedDate, "MMM d")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Total events</span>
              <span className="text-zinc-100">{visibleEvents.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Focus blocks</span>
              <span className="text-zinc-100">{visibleEvents.filter((event) => event.kind === "focus").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Deadlines</span>
              <span className="text-zinc-100">{visibleEvents.filter((event) => event.kind === "deadline").length}</span>
            </div>
          </CardContent>
        </Card>

          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick add</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action) => (
                <button
                  key={action}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-zinc-900 bg-zinc-950/50 px-3 py-2 text-left text-sm text-zinc-200 transition-colors hover:border-zinc-700"
                >
                  <span>{action}</span>
                  <Plus className="h-4 w-4 text-zinc-500" />
                </button>
              ))}
            </CardContent>
          </Card>

      </aside>

      {selectedEvent ? <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} /> : null}
    </div>
  );
}
