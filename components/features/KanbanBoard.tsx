"use client";

import type { ReactNode } from "react";

import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { TaskCard } from "@/components/features/TaskCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskStatus as SharedTaskStatus } from "@/types/task-status";

export type TaskStatus = SharedTaskStatus;

type KanbanTask = {
  id: string;
  title: string;
  description: string;
  assignee: string;
  initials: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  labels: string[];
  status: TaskStatus;
  subtasksDone: number;
  subtasksTotal: number;
  comments: number;
  estimateHours: number;
  progress: number;
  recurring?: boolean;
  dependency?: string;
  startDate: string;
  endDate: string;
};

const statusColumns: Array<{ id: TaskStatus; title: string }> = [
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

function isOverdue(dueDate: string) {
  const parsed = new Date(dueDate);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  return parsed < new Date();
}

function DroppableColumn({
  id,
  title,
  count,
  children,
}: {
  id: TaskStatus;
  title: string;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "space-y-3 rounded-xl border bg-zinc-950/50 p-3 transition-colors",
        isOver ? "border-zinc-700" : "border-zinc-900",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{title}</h2>
        <Badge variant="default">{count}</Badge>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function DraggableTaskCard({
  task,
  selected,
  active,
  onClick,
  onSelect,
}: {
  task: KanbanTask;
  selected?: boolean;
  active?: boolean;
  onClick: () => void;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { status: task.status },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : "transform 200ms ease, opacity 200ms ease, scale 200ms ease",
    scale: isDragging ? 0.92 : 1,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "origin-center rounded-xl transition-shadow duration-200",
        isDragging && "z-50 shadow-2xl shadow-black/60",
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
            selected ? "border-zinc-700 bg-zinc-900 text-zinc-100" : "border-zinc-900 bg-zinc-950 text-zinc-500 hover:text-zinc-200",
          )}
          aria-label={`Select ${task.title}`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="rounded-md border border-zinc-900 bg-zinc-950 px-2 py-1 text-zinc-500 hover:text-zinc-200"
          aria-label={`Drag ${task.title}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <TaskCard
        title={task.title}
        description={task.description}
        assignee={task.assignee}
        initials={task.initials}
        dueDate={task.dueDate}
        priority={task.priority}
        labels={task.labels}
        subtasksDone={task.subtasksDone}
        subtasksTotal={task.subtasksTotal}
        comments={task.comments}
        selected={selected || active}
        overdue={isOverdue(task.dueDate)}
        onClick={onClick}
        className={cn("transition-shadow duration-200", isDragging ? "shadow-xl" : "shadow-none")}
      />
    </div>
  );
}

export function KanbanBoard({
  tasks,
  selectedTaskIds,
  activeTaskId,
  onTaskOpen,
  onTaskSelect,
  onStatusChange,
  onDragStart,
  onDragEnd,
}: {
  tasks: KanbanTask[];
  selectedTaskIds: string[];
  activeTaskId: string | null;
  onTaskOpen: (task: KanbanTask) => void;
  onTaskSelect: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDragStart: (taskId: string | null) => void;
  onDragEnd: () => void;
}) {
  const tasksByStatus = statusColumns.reduce<Record<TaskStatus, KanbanTask[]>>(
    (accumulator, column) => ({
      ...accumulator,
      [column.id]: tasks.filter((task) => task.status === column.id),
    }),
    { todo: [], in_progress: [], review: [], done: [] },
  );

  function handleDragStart(event: DragStartEvent) {
    onDragStart(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;

    if (overId && statusColumns.some((column) => column.id === overId)) {
      onStatusChange(taskId, overId as TaskStatus);
    }

    onDragEnd();
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="grid gap-4 overflow-x-auto xl:grid-cols-4">
        {statusColumns.map((column) => (
          <DroppableColumn key={column.id} id={column.id} title={column.title} count={tasksByStatus[column.id].length}>
            {tasksByStatus[column.id].map((task) => (
              <DraggableTaskCard
                key={task.id}
                task={task}
                selected={selectedTaskIds.includes(task.id)}
                active={activeTaskId === task.id}
                onClick={() => onTaskOpen(task)}
                onSelect={() => onTaskSelect(task.id)}
              />
            ))}
          </DroppableColumn>
        ))}
      </div>
    </DndContext>
  );
}
