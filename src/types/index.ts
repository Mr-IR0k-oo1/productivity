export interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: "admin" | "member";
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  workspace_id: string;
  assignee_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Idea {
  id: string;
  title: string;
  content?: string;
  status: "brainstorming" | "planning" | "in_progress" | "completed" | "archived";
  workspace_id: string;
  created_by: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  task_id?: string;
  user_id: string;
  workspace_id: string;
  description?: string;
  start_time: string;
  end_time?: string;
  duration?: number;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  all_day?: boolean;
  workspace_id: string;
  created_by: string;
  attendees: string[];
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  parent_id?: string;
  resource_type: "task" | "idea" | "time_entry";
  resource_id: string;
  user_id: string;
  created_at: string;
}