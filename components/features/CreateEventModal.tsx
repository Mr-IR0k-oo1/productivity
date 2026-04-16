"use client";

import { useState } from "react";
import { format, addHours } from "date-fns";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EventKind = "meeting" | "focus" | "deadline" | "review" | "travel";

interface CreateEventModalProps {
  onClose: () => void;
  onCreate: (event: {
    title: string;
    description: string;
    startsAt: string;
    endsAt: string;
    kind: EventKind;
    project: string;
    location: string;
  }) => void;
  initialDate?: Date;
}

export function CreateEventModal({ onClose, onCreate, initialDate }: CreateEventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<EventKind>("meeting");
  const [project, setProject] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(initialDate ? format(initialDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const handleSubmit = () => {
    if (!title.trim()) return;

    const startsAt = new Date(`${date}T${startTime}:00`).toISOString();
    const endsAt = new Date(`${date}T${endTime}:00`).toISOString();

    onCreate({
      title: title.trim(),
      description,
      startsAt,
      endsAt,
      kind,
      project,
      location,
    });
    onClose();
  };

  const eventKinds: { value: EventKind; label: string; color: string }[] = [
    { value: "meeting", label: "Meeting", color: "bg-blue-500" },
    { value: "focus", label: "Focus", color: "bg-emerald-500" },
    { value: "deadline", label: "Deadline", color: "bg-amber-500" },
    { value: "review", label: "Review", color: "bg-zinc-500" },
    { value: "travel", label: "Travel", color: "bg-violet-500" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Create Event</CardTitle>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div>
            <Input
              placeholder="Event title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Type</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as EventKind)}
                className="h-10 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 text-sm text-zinc-100"
              >
                {eventKinds.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Start time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">End time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Project</label>
              <Input
                placeholder="Project name"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-zinc-400">Location</label>
              <Input
                placeholder="Location or Zoom"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-zinc-400">Description</label>
            <textarea
              placeholder="Add notes or details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-900 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim()}>
              Create Event
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
