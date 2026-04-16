export const taskStatusValues = ["backlog", "todo", "in_progress", "review", "done", "blocked"] as const;

export type TaskStatus = (typeof taskStatusValues)[number];