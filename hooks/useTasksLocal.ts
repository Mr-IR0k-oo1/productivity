"use client";

import { useCallback, useEffect, useState } from "react";

import type { TaskStatus } from "@/types/task-status";
import type { TaskViewMetadata } from "@/types/task-view-metadata";

// ===== Types =====

export type TaskDTO = {
  id: string;
  title: string;
  description: Record<string, unknown> | string | null;
  assigneeId: string | null;
  status: TaskStatus;
  priority: number;
  dueDate: string | null;
  metadata: TaskViewMetadata;
  createdAt: string;
  updatedAt: string;
};

export type TaskFilters = {
  status?: TaskStatus;
  assigneeId?: string;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
};

// ===== localStorage key =====

const TASKS_KEY = "orbit-tasks";

// ===== Helpers =====

function generateId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function now(): string {
  return new Date().toISOString();
}

function loadTasks(): TaskDTO[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks(tasks: TaskDTO[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

// ===== Hooks =====

export function useTasks(filters: TaskFilters = {}) {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loaded = loadTasks();
    let filtered = loaded;

    if (filters.status) {
      filtered = filtered.filter((task) => task.status === filters.status);
    }

    if (filters.assigneeId) {
      filtered = filtered.filter((task) => task.assigneeId === filters.assigneeId);
    }

    if (filters.dueFrom) {
      const fromDate = new Date(filters.dueFrom);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) >= fromDate;
      });
    }

    if (filters.dueTo) {
      const toDate = new Date(filters.dueTo);
      filtered = filtered.filter((task) => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) <= toDate;
      });
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchLower) ||
          (typeof task.description === "string" &&
            task.description.toLowerCase().includes(searchLower)),
      );
    }

    // Sort by updatedAt descending
    filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    setTasks(filtered);
    setLoading(false);
  }, [filters]);

  return { tasks, loading };
}

export function useTask(id: string | null) {
  const [task, setTask] = useState<TaskDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    const loaded = loadTasks();
    const found = loaded.find((t) => t.id === id) || null;
    setTask(found);
    setLoading(false);
  }, [id]);

  return { task, loading };
}

export function useCreateTask() {
  return useCallback((payload: {
    title: string;
    description?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: number;
    dueDate?: string;
    metadata?: Partial<TaskViewMetadata>;
  }) => {
    const tasks = loadTasks();
    const newTask: TaskDTO = {
      id: generateId(),
      title: payload.title,
      description: payload.description ?? null,
      assigneeId: payload.assigneeId ?? null,
      status: payload.status ?? "todo",
      priority: payload.priority ?? 2,
      dueDate: payload.dueDate ?? null,
      metadata: {
        labels: payload.metadata?.labels ?? [],
        tags: payload.metadata?.tags ?? [],
        projectId: payload.metadata?.projectId ?? null,
        estimate: payload.metadata?.estimate ?? null,
        timeSpent: payload.metadata?.timeSpent ?? 0,
        billable: payload.metadata?.billable ?? true,
        dependencies: payload.metadata?.dependencies ?? [],
        subtasks: payload.metadata?.subtasks ?? [],
        attachments: payload.metadata?.attachments ?? [],
        comments: payload.metadata?.comments ?? [],
        activity: payload.metadata?.activity ?? [],
      },
      createdAt: now(),
      updatedAt: now(),
    };
    tasks.push(newTask);
    saveTasks(tasks);
    return newTask;
  }, []);
}

export function useUpdateTask() {
  return useCallback((id: string, updates: Partial<TaskDTO>) => {
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const updated = { ...tasks[index], ...updates, updatedAt: now() };
    tasks[index] = updated;
    saveTasks(tasks);
    return updated;
  }, []);
}

export function useDeleteTask() {
  return useCallback((id: string) => {
    const tasks = loadTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;

    saveTasks(filtered);
    return true;
  }, []);
}

export function useUpdateTaskStatus() {
  return useCallback((taskId: string, status: TaskStatus) => {
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const updated = { ...tasks[index], status, updatedAt: now() };
    tasks[index] = updated;
    saveTasks(tasks);
    return updated;
  }, []);
}

export function useAddTaskDependency() {
  return useCallback((taskId: string, dependsOnTaskId: string) => {
    const tasks = loadTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    const task = tasks[index];
    const dependencies = task.metadata.dependencies ?? [];
    if (!dependencies.includes(dependsOnTaskId)) {
      dependencies.push(dependsOnTaskId);
    }

    const updated = {
      ...task,
      metadata: { ...task.metadata, dependencies },
      updatedAt: now(),
    };
    tasks[index] = updated;
    saveTasks(tasks);
    return updated;
  }, []);
}
