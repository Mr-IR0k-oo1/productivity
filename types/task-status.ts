export const taskStatusValues = ["todo", "in_progress", "review", "done"] as const;

export type TaskStatus = (typeof taskStatusValues)[number];