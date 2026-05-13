"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Columns3,
  Edit2,
  GitBranch,
  Lightbulb,
  List,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IdeaDTO, useConvertIdeaMutation, useCreateIdeaMutation, useDeleteIdeaMutation, useIdeasQuery, useUpdateIdeaMutation, useVoteIdeaMutation } from "@/hooks/useIdeas";
import { useTasksQuery } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

type ViewMode = "board" | "list" | "mindmap";
type IdeaStatus = "draft" | "validated" | "archived" | "converted";

type IdeaComment = {
  id: string;
  author: string;
  message: string;
  timestamp: string;
};

type IdeaRecord = {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: IdeaStatus;
  author: string;
  tags: string[];
  votes: number;
  votedByMe: boolean;
  impact: number;
  createdAt: string;
  convertedTaskId?: string;
  relatedIdeaIds: string[];
  comments: IdeaComment[];
  dependencies: Array<{ type: "idea" | "task"; id: string; title: string }>;
};

const statusColumns: Array<{ id: IdeaStatus; label: string }> = [
  { id: "draft", label: "Draft" },
  { id: "validated", label: "Validated" },
  { id: "archived", label: "Archived" },
  { id: "converted", label: "Converted" },
];

const initialIdeas: IdeaRecord[] = [
  {
    id: "idea-1",
    title: "AI standup summaries",
    summary: "Generate concise standup notes from completed tasks and calendar events.",
    content:
      "Use task transitions, comments, and time entries to create per-team daily recaps. Add export to Slack and email.",
    status: "validated",
    author: "Arun",
    tags: ["AI", "Automation", "Ops"],
    votes: 9,
    votedByMe: true,
    impact: 8,
    createdAt: "Apr 13",
    relatedIdeaIds: ["idea-3"],
    comments: [
      { id: "c-1", author: "Bala", message: "Would save us 20 minutes every morning.", timestamp: "2h ago" },
      { id: "c-2", author: "Dev", message: "Need confidence scoring in output.", timestamp: "58m ago" },
    ],
    dependencies: [],
  },
  {
    id: "idea-2",
    title: "Focus debt heatmap",
    summary: "Visualize meeting-heavy weeks against deep work availability.",
    content:
      "Compute focus debt from calendar blocks and task completion delays. Show heat by team, by role, and by sprint.",
    status: "draft",
    author: "Chitra",
    tags: ["Analytics", "Calendar"],
    votes: 4,
    votedByMe: false,
    impact: 7,
    createdAt: "Apr 12",
    relatedIdeaIds: ["idea-1", "idea-4"],
    comments: [{ id: "c-3", author: "Arun", message: "Design can lead visual language.", timestamp: "1d ago" }],
    dependencies: [],
  },
  {
    id: "idea-3",
    title: "Task to retro signal extractor",
    summary: "Auto-detect recurring sprint blockers from comments and dependencies.",
    content:
      "Cluster blocked tasks and repeated comment terms to suggest retro topics with owners and confidence indicators.",
    status: "draft",
    author: "Bala",
    tags: ["AI", "Tasks", "Quality"],
    votes: 6,
    votedByMe: false,
    impact: 9,
    createdAt: "Apr 11",
    relatedIdeaIds: ["idea-1"],
    comments: [{ id: "c-4", author: "Dev", message: "Could pair with dependency graph.", timestamp: "8h ago" }],
    dependencies: [],
  },
  {
    id: "idea-4",
    title: "Pipeline handoff checklist templates",
    summary: "Reusable handoff templates for design, engineering, and QA checkpoints.",
    content:
      "Attach milestone templates to ideas or tasks and pre-fill review gates with role-specific steps.",
    status: "converted",
    author: "Arun",
    tags: ["Templates", "Workflow"],
    votes: 11,
    votedByMe: true,
    impact: 6,
    createdAt: "Apr 10",
    convertedTaskId: "task-idea-4",
    relatedIdeaIds: ["idea-2"],
    comments: [{ id: "c-5", author: "Chitra", message: "This is already in sprint backlog.", timestamp: "3d ago" }],
    dependencies: [],
  },
  {
    id: "idea-5",
    title: "Deprecated integrations cleanup",
    summary: "Retire outdated connectors and migrate remaining workspaces.",
    content:
      "Mark sunset date in app, show migration wizard, and archive old integration docs automatically.",
    status: "archived",
    author: "Dev",
    tags: ["Maintenance"],
    votes: 2,
    votedByMe: false,
    impact: 3,
    createdAt: "Apr 09",
    relatedIdeaIds: [],
    comments: [],
    dependencies: [],
  },
];

function IdeaLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/60 p-6">
        <div className="space-y-4">
          <div className="h-8 w-32 rounded bg-zinc-800" />
          <div className="h-4 w-48 rounded bg-zinc-800" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-zinc-800" />
            <div className="h-8 w-20 rounded bg-zinc-800" />
            <div className="h-8 w-20 rounded bg-zinc-800" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-6">
            <div className="h-4 w-20 rounded bg-zinc-800" />
            <div className="mt-3 h-8 w-16 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-4">
        {["Draft", "Validated", "Archived", "Converted"].map((col) => (
          <div key={col} className="space-y-3 rounded-xl border border-zinc-900 bg-zinc-950/40 p-3">
            <div className="h-5 w-16 rounded bg-zinc-800" />
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-lg border border-zinc-900 bg-zinc-900/50" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function IdeaEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/20 py-16 text-center">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-zinc-900 p-4">
            <svg className="h-8 w-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3 3 0 1014 13h3m-10 0a3 3 0 11-.707-5.657l.707-.707" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-zinc-200">No ideas yet</h3>
          <p className="mt-1 text-sm text-zinc-500">Capture your first idea</p>
        </div>
        <button
          onClick={onCreate}
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Idea
        </button>
      </div>
    </div>
  );
}

function toIdeaRecord(idea: IdeaDTO, previous?: IdeaRecord): IdeaRecord {
  const parsedDate = new Date(idea.createdAt);
  const createdAt = Number.isNaN(parsedDate.getTime())
    ? "Now"
    : parsedDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" });

  const normalizedContent =
    typeof idea.content === "string"
      ? idea.content
      : idea.content
        ? JSON.stringify(idea.content)
        : null;

  return {
    id: idea.id,
    title: idea.title,
    summary: idea.summary ?? previous?.summary ?? "No summary yet.",
    content: normalizedContent ?? previous?.content ?? idea.summary ?? idea.title,
    status: idea.status,
    author: previous?.author ?? "Teammate",
    tags: previous?.tags ?? ["Idea"],
    votes: previous?.votes ?? 0,
    votedByMe: previous?.votedByMe ?? false,
    impact: previous?.impact ?? 5,
    createdAt,
    convertedTaskId: idea.convertedTaskId ?? undefined,
    relatedIdeaIds: previous?.relatedIdeaIds ?? [],
    comments: previous?.comments ?? [],
    dependencies: previous?.dependencies ?? [],
  };
}

function statusBadge(status: IdeaStatus) {
  if (status === "validated") return "success";
  if (status === "converted") return "warning";
  return "default";
}

function VoteButton({
  votes,
  voted,
  onToggle,
}: {
  votes: number;
  voted: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
        voted
          ? "border-emerald-800 bg-emerald-950/60 text-emerald-200"
          : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700",
      )}
      aria-label="Toggle vote"
    >
      <ThumbsUp className="h-3.5 w-3.5" />
      {votes}
    </button>
  );
}

function IdeaCard({
  idea,
  onOpen,
  onVote,
  onConvert,
}: {
  idea: IdeaRecord;
  onOpen: () => void;
  onVote: () => void;
  onConvert: () => void;
}) {
  return (
    <Card className="border-zinc-900 bg-zinc-950/70">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onOpen} className="text-left">
            <CardTitle className="text-base leading-5 hover:text-zinc-50">{idea.title}</CardTitle>
          </button>
          <Badge variant={statusBadge(idea.status)}>{idea.status}</Badge>
        </div>
        <p className="text-sm text-zinc-400">{idea.summary}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
          <div className="rounded-md border border-zinc-900 bg-zinc-950/70 px-2 py-1.5">Impact {idea.impact}/10</div>
          <div className="rounded-md border border-zinc-900 bg-zinc-950/70 px-2 py-1.5">{idea.createdAt}</div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Avatar className="h-6 w-6">
              <AvatarFallback>{idea.author.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {idea.author}
          </div>
          <div className="flex items-center gap-2">
            <VoteButton votes={idea.votes} voted={idea.votedByMe} onToggle={onVote} />
            <div className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300">
              <MessageCircle className="h-3.5 w-3.5" />
              {idea.comments.length}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button variant="secondary" size="sm" onClick={onOpen}>
            Open
          </Button>
          <Button size="sm" onClick={onConvert} disabled={idea.status === "converted"}>
            {idea.status === "converted" ? "Converted" : "Convert to Task"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CommentThread({
  comments,
  onAddComment,
}: {
  comments: IdeaComment[];
  onAddComment: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    onAddComment(value);
    setDraft("");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-200">Comments</p>
      <div className="max-h-48 space-y-2 overflow-auto pr-1">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-md border border-zinc-900 bg-zinc-950/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-zinc-200">{comment.author}</p>
                <p className="text-[11px] text-zinc-500">{comment.timestamp}</p>
              </div>
              <p className="mt-1 text-sm text-zinc-300">{comment.message}</p>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-zinc-800 px-3 py-2 text-sm text-zinc-500">
            No comments yet.
          </p>
        )}
      </div>
      <form onSubmit={submitComment} className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment"
        />
        <Button type="submit" size="sm">
          Add
        </Button>
      </form>
    </div>
  );
}

function NewIdeaModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (payload: { title: string; summary: string; content: string; tags: string[]; status: IdeaStatus }) => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState<IdeaStatus>("draft");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 2) return;

    onCreate({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim() || summary.trim(),
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      status,
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-2xl border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900 pb-4">
          <CardTitle className="text-xl">Create Idea</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Idea title" />
            <Input
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Short summary"
            />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[120px] w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-600"
              placeholder="Detailed content"
            />
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="Tags, comma separated"
              />
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as IdeaStatus)}
                className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
              >
                {statusColumns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Idea</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

type DependencyItem = { type: "idea" | "task"; id: string; title: string };

function DependencyModal({
  isOpen,
  onClose,
  onSave,
  currentIdeaId,
  ideas,
  tasks,
  existingDependencies,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dependencies: DependencyItem[]) => void;
  currentIdeaId: string;
  ideas: IdeaRecord[];
  tasks: Array<{ id: string; title: string }>;
  existingDependencies: DependencyItem[];
}) {
  const [activeTab, setActiveTab] = useState<"ideas" | "tasks">("ideas");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DependencyItem[]>(existingDependencies);

  const filteredIdeas = ideas
    .filter((idea) => idea.id !== currentIdeaId)
    .filter((idea) =>
      search === "" || idea.title.toLowerCase().includes(search.toLowerCase())
    );

  const filteredTasks = tasks.filter((task) =>
    search === "" || task.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (item: DependencyItem) => {
    setSelected((current) => {
      const exists = current.some((s) => s.id === item.id && s.type === item.type);
      if (exists) {
        return current.filter((s) => !(s.id === item.id && s.type === item.type));
      }
      return [...current, item];
    });
  };

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Add Dependencies</CardTitle>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("ideas")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                activeTab === "ideas"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Ideas
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tasks")}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                activeTab === "tasks"
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              Tasks
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab}...`}
              className="pl-9"
            />
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {activeTab === "ideas" ? (
              filteredIdeas.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-500">No ideas found</p>
              ) : (
                filteredIdeas.map((idea) => {
                  const isSelected = selected.some((s) => s.id === idea.id && s.type === "idea");
                  return (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => toggleItem({ type: "idea", id: idea.id, title: idea.title })}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors",
                        isSelected
                          ? "border-emerald-600 bg-emerald-950/30"
                          : "border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded border",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-zinc-700"
                        )}
                      >
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-zinc-200">{idea.title}</p>
                        <p className="truncate text-xs text-zinc-500">{idea.summary}</p>
                      </div>
                      <Badge variant="default" className="shrink-0">Idea</Badge>
                    </button>
                  );
                })
              )
            ) : filteredTasks.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">No tasks found</p>
            ) : (
              filteredTasks.map((task) => {
                const isSelected = selected.some((s) => s.id === task.id && s.type === "task");
                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => toggleItem({ type: "task", id: task.id, title: task.title })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors",
                      isSelected
                        ? "border-emerald-600 bg-emerald-950/30"
                        : "border-zinc-800 hover:border-zinc-700"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded border",
                        isSelected
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-zinc-700"
                      )}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-zinc-200">{task.title}</span>
                    <Badge variant="default" className="shrink-0">Task</Badge>
                  </button>
                );
              })
            )}
          </div>

          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 p-2">
              {selected.map((item) => (
                <Badge key={`${item.type}-${item.id}`} variant="default" className="gap-1 pr-1">
                  {item.type === "idea" ? <Lightbulb className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {item.title}
                  <button
                    type="button"
                    onClick={() => toggleItem(item)}
                    className="ml-1 rounded-full p-0.5 hover:bg-zinc-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-zinc-900 pt-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save {selected.length > 0 && `(${selected.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IdeaDetailModal({
  idea,
  onClose,
  onVote,
  onConvert,
  onAddComment,
  onAddDependency,
  onRemoveDependency,
  onEdit,
  onDelete,
}: {
  idea: IdeaRecord;
  onClose: () => void;
  onVote: () => void;
  onConvert: () => void;
  onAddComment: (message: string) => void;
  onAddDependency: () => void;
  onRemoveDependency: (dependencyId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-4xl overflow-auto border-zinc-800 bg-zinc-950">
        <CardHeader className="border-b border-zinc-900 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={statusBadge(idea.status)}>{idea.status}</Badge>
                <Badge variant="default">Impact {idea.impact}/10</Badge>
              </div>
              <CardTitle className="mt-3 text-2xl">{idea.title}</CardTitle>
              <p className="mt-2 text-sm text-zinc-400">{idea.summary}</p>
            </div>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-zinc-300">
                <p>{idea.content}</p>
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardContent className="p-4">
                <CommentThread comments={idea.comments} onAddComment={onAddComment} />
              </CardContent>
            </Card>

            {idea.dependencies.length > 0 && (
              <Card className="border-zinc-900 bg-zinc-950/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Dependencies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {idea.dependencies.map((dep) => (
                    <div key={`${dep.type}-${dep.id}`} className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        {dep.type === "idea" ? (
                          <Lightbulb className="h-4 w-4 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        )}
                        <span className="text-sm text-zinc-200">{dep.title}</span>
                        <Badge variant="default" className="text-xs">{dep.type}</Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveDependency(dep.id)}
                        className="rounded-full p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <VoteButton votes={idea.votes} voted={idea.votedByMe} onToggle={onVote} />
                  <div className="inline-flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {idea.comments.length}
                  </div>
                </div>
                <Button className="w-full justify-start" onClick={onConvert} disabled={idea.status === "converted"}>
                  <CheckCircle2 className="h-4 w-4" />
                  {idea.status === "converted" ? "Already Converted" : "Convert to Task"}
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={onAddDependency}>
                  <GitBranch className="h-4 w-4" />
                  Add Dependency Link
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                  Edit Idea
                </Button>
                <Button className="w-full justify-start bg-red-900/50 text-red-200 hover:bg-red-900" variant="secondary" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                  Delete Idea
                </Button>
              </CardContent>
            </Card>

            <Card className="border-zinc-900 bg-zinc-950/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Author</span>
                  <span className="text-zinc-100">{idea.author}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span className="text-zinc-100">{idea.createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-zinc-100">{idea.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Task Link</span>
                  <span className="text-zinc-100">{idea.convertedTaskId ?? "Not converted"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dependencies</span>
                  <span className="text-zinc-100">{idea.dependencies.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BoardView({
  ideas,
  onOpen,
  onVote,
  onConvert,
}: {
  ideas: IdeaRecord[];
  onOpen: (id: string) => void;
  onVote: (id: string) => void;
  onConvert: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-4">
      {statusColumns.map((column) => {
        const columnIdeas = ideas.filter((idea) => idea.status === column.id);

        return (
          <section key={column.id} className="space-y-3 rounded-xl border border-zinc-900 bg-zinc-950/40 p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">{column.label}</h2>
              <Badge variant="default">{columnIdeas.length}</Badge>
            </div>
            <div className="space-y-3">
              {columnIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onOpen={() => onOpen(idea.id)}
                  onVote={() => onVote(idea.id)}
                  onConvert={() => onConvert(idea.id)}
                />
              ))}
              {columnIdeas.length === 0 ? (
                <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-sm text-zinc-600">No ideas</p>
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function ListView({
  ideas,
  onOpen,
  onVote,
  onConvert,
}: {
  ideas: IdeaRecord[];
  onOpen: (id: string) => void;
  onVote: (id: string) => void;
  onConvert: (id: string) => void;
}) {
  return (
    <Card className="border-zinc-900 bg-zinc-950/60">
      <CardHeader className="border-b border-zinc-900 pb-4">
        <CardTitle className="text-xl">Ideas List</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-zinc-950/70 text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Impact</th>
              <th className="px-4 py-3">Votes</th>
              <th className="px-4 py-3">Comments</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => (
              <tr key={idea.id} className="border-t border-zinc-900 text-zinc-200">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onOpen(idea.id)} className="text-left hover:text-zinc-50">
                    <p className="font-medium">{idea.title}</p>
                    <p className="text-xs text-zinc-500">{idea.tags.join(" . ")}</p>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge(idea.status)}>{idea.status}</Badge>
                </td>
                <td className="px-4 py-3">{idea.impact}/10</td>
                <td className="px-4 py-3">
                  <VoteButton votes={idea.votes} voted={idea.votedByMe} onToggle={() => onVote(idea.id)} />
                </td>
                <td className="px-4 py-3">{idea.comments.length}</td>
                <td className="px-4 py-3">{idea.author}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => onOpen(idea.id)}>
                      Open
                    </Button>
                    <Button size="sm" onClick={() => onConvert(idea.id)} disabled={idea.status === "converted"}>
                      Convert
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function MindMapView({ ideas, onOpen }: { ideas: IdeaRecord[]; onOpen: (id: string) => void }) {
  const ideasByStatus = statusColumns.map((column) => ({
    status: column.id,
    ideas: ideas.filter((idea) => idea.status === column.id),
  }));

  const positions = new Map<string, { x: number; y: number }>();
  ideasByStatus.forEach((group, groupIndex) => {
    group.ideas.forEach((idea, itemIndex) => {
      positions.set(idea.id, { x: 120 + groupIndex * 280, y: 80 + itemIndex * 120 });
    });
  });

  const lineSegments = ideas.flatMap((idea) =>
    idea.relatedIdeaIds
      .filter((targetId) => positions.has(targetId) && positions.has(idea.id))
      .map((targetId) => ({
        from: positions.get(idea.id) as { x: number; y: number },
        to: positions.get(targetId) as { x: number; y: number },
        key: `${idea.id}-${targetId}`,
      })),
  );

  return (
    <Card className="border-zinc-900 bg-zinc-950/60">
      <CardHeader className="border-b border-zinc-900 pb-4">
        <CardTitle className="text-xl">Mind Map</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative h-[560px] overflow-auto rounded-xl border border-zinc-900 bg-zinc-950/40">
          <svg width={1200} height={560} className="absolute left-0 top-0">
            {lineSegments.map((line) => (
              <line
                key={line.key}
                x1={line.from.x + 70}
                y1={line.from.y + 24}
                x2={line.to.x + 70}
                y2={line.to.y + 24}
                stroke="rgb(63 63 70)"
                strokeWidth={1.5}
              />
            ))}
          </svg>

          {statusColumns.map((column, index) => (
            <div
              key={column.id}
              className="absolute top-3 text-xs uppercase tracking-[0.18em] text-zinc-600"
              style={{ left: `${90 + index * 280}px` }}
            >
              {column.label}
            </div>
          ))}

          {ideas.map((idea) => {
            const position = positions.get(idea.id);
            if (!position) return null;

            return (
              <button
                key={idea.id}
                type="button"
                onClick={() => onOpen(idea.id)}
                className="absolute w-[165px] rounded-lg border border-zinc-800 bg-zinc-900/90 px-3 py-2 text-left transition-colors hover:border-zinc-600"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
              >
                <p className="line-clamp-2 text-sm font-medium text-zinc-100">{idea.title}</p>
                <p className="mt-1 text-xs text-zinc-500">Impact {idea.impact}/10</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function IdeaWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaIdFromQuery = searchParams.get("ideaId");
  const [ideas, setIdeas] = useState<IdeaRecord[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IdeaStatus>("all");
  const [myIdeasOnly, setMyIdeasOnly] = useState(false);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [dependenciesOpen, setDependenciesOpen] = useState(false);
  const ideasQuery = useIdeasQuery();
  const tasksQuery = useTasksQuery();
  const createIdeaMutation = useCreateIdeaMutation();
  const convertIdeaMutation = useConvertIdeaMutation();
  const deleteIdeaMutation = useDeleteIdeaMutation();
  const voteIdeaMutation = useVoteIdeaMutation();
  const apiEnabled = ideasQuery.isSuccess;
  const isLoading = ideasQuery.isLoading;
  const isError = ideasQuery.isError;
  const showEmptyState = ideasQuery.isSuccess && ideasQuery.data?.length === 0;

  useEffect(() => {
    if (!ideasQuery.data) return;

    setIdeas((current) => {
      const previousById = new Map(current.map((idea) => [idea.id, idea]));
      return ideasQuery.data.map((idea) => toIdeaRecord(idea, previousById.get(idea.id)));
    });
  }, [ideasQuery.data]);

  useEffect(() => {
    setSelectedIdeaId(ideaIdFromQuery);
  }, [ideaIdFromQuery]);

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchesSearch =
        search.trim().length === 0 ||
        [idea.title, idea.summary, idea.content, idea.author, ...idea.tags].some((value) =>
          value.toLowerCase().includes(search.toLowerCase()),
        );
      const matchesStatus = statusFilter === "all" || idea.status === statusFilter;
      const matchesMine = !myIdeasOnly || idea.author === "Arun";
      return matchesSearch && matchesStatus && matchesMine;
    });
  }, [ideas, myIdeasOnly, search, statusFilter]);

  const selectedIdea = selectedIdeaId ? ideas.find((idea) => idea.id === selectedIdeaId) ?? null : null;

  function updateIdea(ideaId: string, updater: (idea: IdeaRecord) => IdeaRecord) {
    setIdeas((current) => current.map((idea) => (idea.id === ideaId ? updater(idea) : idea)));
  }

  function toggleVote(ideaId: string) {
    updateIdea(ideaId, (idea) => {
      const nextVoted = !idea.votedByMe;
      return {
        ...idea,
        votedByMe: nextVoted,
        votes: nextVoted ? idea.votes + 1 : Math.max(0, idea.votes - 1),
      };
    });
  }

  function convertToTask(ideaId: string) {
    if (apiEnabled) {
      convertIdeaMutation.mutate({ ideaId });
      return;
    }

    updateIdea(ideaId, (idea) => {
      if (idea.status === "converted") return idea;
      return {
        ...idea,
        status: "converted",
        convertedTaskId: `task-${idea.id}`,
      };
    });
  }

  function addComment(ideaId: string, message: string) {
    updateIdea(ideaId, (idea) => ({
      ...idea,
      comments: [
        {
          id: `comment-${Date.now()}`,
          author: "You",
          message,
          timestamp: "Just now",
        },
        ...idea.comments,
      ],
    }));
  }

  function createIdea(payload: { title: string; summary: string; content: string; tags: string[]; status: IdeaStatus }) {
    if (apiEnabled) {
      createIdeaMutation.mutate(
        {
          title: payload.title,
          summary: payload.summary,
          content: payload.content,
        },
        {
          onSuccess: (result) => {
            setSelectedIdeaId(result.data.id);
            router.push(`/ideas?ideaId=${encodeURIComponent(result.data.id)}`);
          },
        },
      );
      return;
    }

    const newIdea: IdeaRecord = {
      id: `idea-${Date.now()}`,
      title: payload.title,
      summary: payload.summary || payload.title,
      content: payload.content,
      status: payload.status,
      author: "Arun",
      tags: payload.tags,
      votes: 1,
      votedByMe: true,
      impact: 6,
      createdAt: "Now",
      relatedIdeaIds: [],
      comments: [],
      dependencies: [],
    };

    setIdeas((current) => [newIdea, ...current]);
    setSelectedIdeaId(newIdea.id);
    router.push(`/ideas?ideaId=${encodeURIComponent(newIdea.id)}`);
  }

  function handleAddDependency() {
    setDependenciesOpen(true);
  }

  function handleRemoveDependency(ideaId: string, dependencyId: string) {
    updateIdea(ideaId, (idea) => ({
      ...idea,
      dependencies: idea.dependencies.filter((d) => d.id !== dependencyId),
    }));
  }

  function handleSaveDependencies(ideaId: string, dependencies: DependencyItem[]) {
    updateIdea(ideaId, (idea) => ({
      ...idea,
      dependencies,
    }));
  }

  function handleEditIdea(ideaId: string) {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const newTitle = prompt("Edit title:", idea.title);
    if (newTitle && newTitle !== idea.title) {
      updateIdea(ideaId, (i) => ({ ...i, title: newTitle }));
    }

    const newSummary = prompt("Edit summary:", idea.summary);
    if (newSummary && newSummary !== idea.summary) {
      updateIdea(ideaId, (i) => ({ ...i, summary: newSummary }));
    }

    const newContent = prompt("Edit content:", idea.content);
    if (newContent && newContent !== idea.content) {
      updateIdea(ideaId, (i) => ({ ...i, content: newContent }));
    }
  }

  function handleDeleteIdea(ideaId: string) {
    if (!confirm("Are you sure you want to delete this idea?")) return;

    if (apiEnabled) {
      deleteIdeaMutation.mutate(ideaId);
    }

    setIdeas((current) => current.filter((i) => i.id !== ideaId));
    setSelectedIdeaId(null);
    router.push("/ideas");
  }

  function handleVoteIdea(ideaId: string) {
    const idea = ideas.find(i => i.id === ideaId);
    if (!idea) return;

    const newVoted = !idea.votedByMe;

    if (apiEnabled) {
      voteIdeaMutation.mutate({ ideaId, vote: newVoted });
    }

    updateIdea(ideaId, (i) => ({
      ...i,
      votedByMe: newVoted,
      votes: newVoted ? i.votes + 1 : Math.max(0, i.votes - 1),
    }));
  }

  const tasksList = tasksQuery.data?.map((t) => ({ id: t.id, title: t.title })) ?? [];

  return (
    <div className="space-y-6 page-animate">
      <Card className="border-zinc-900 bg-zinc-950/60">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Ideas</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-100">Idea workspace</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Capture, validate, discuss, and convert high-value ideas into executable work.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Idea
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "board", label: "Board", icon: Columns3 },
              { id: "list", label: "List", icon: List },
              { id: "mindmap", label: "Mind Map", icon: GitBranch },
            ].map((view) => {
              const Icon = view.icon;
              const active = viewMode === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => setViewMode(view.id as ViewMode)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                    active
                      ? "border-zinc-700 bg-zinc-900 text-zinc-100"
                      : "border-zinc-900 bg-zinc-950 text-zinc-400 hover:border-zinc-800 hover:text-zinc-200",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {view.label}
                </button>
              );
            })}

            <div className="ml-auto grid w-full gap-2 md:w-auto md:grid-cols-[320px_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search ideas"
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "all" | IdeaStatus)}
                className="h-9 rounded-md border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100"
              >
                <option value="all">All Statuses</option>
                {statusColumns.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={myIdeasOnly}
                  onChange={(event) => setMyIdeasOnly(event.target.checked)}
                />
                My Ideas
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Active Ideas</p>
            <CardTitle className="text-3xl">{ideas.filter((idea) => idea.status !== "archived").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-emerald-400">+2 this week</CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Validated</p>
            <CardTitle className="text-3xl">{ideas.filter((idea) => idea.status === "validated").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400">Ready for conversion</CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Converted</p>
            <CardTitle className="text-3xl">{ideas.filter((idea) => idea.status === "converted").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400">Linked to task flow</CardContent>
        </Card>
        <Card className="border-zinc-900 bg-zinc-950/50">
          <CardHeader className="pb-3">
            <p className="text-sm text-zinc-400">Average Impact</p>
            <CardTitle className="text-3xl">
              {Math.round(ideas.reduce((accumulator, idea) => accumulator + idea.impact, 0) / Math.max(1, ideas.length))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-400">Across all active lanes</CardContent>
        </Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {isLoading ? (
            <IdeaLoadingSkeleton />
          ) : showEmptyState && ideas.length === 0 ? (
            <IdeaEmptyState onCreate={() => setCreateOpen(true)} />
          ) : viewMode === "board" ? (
            <BoardView
              ideas={filteredIdeas}
              onOpen={(ideaId) => {
                setSelectedIdeaId(ideaId);
                router.push(`/ideas?ideaId=${encodeURIComponent(ideaId)}`);
              }}
              onVote={toggleVote}
              onConvert={convertToTask}
            />
          ) : null}
          {viewMode === "list" ? (
            <ListView
              ideas={filteredIdeas}
              onOpen={(ideaId) => {
                setSelectedIdeaId(ideaId);
                router.push(`/ideas?ideaId=${encodeURIComponent(ideaId)}`);
              }}
              onVote={toggleVote}
              onConvert={convertToTask}
            />
          ) : null}
          {viewMode === "mindmap" ? (
            <MindMapView
              ideas={filteredIdeas}
              onOpen={(ideaId) => {
                setSelectedIdeaId(ideaId);
                router.push(`/ideas?ideaId=${encodeURIComponent(ideaId)}`);
              }}
            />
          ) : null}
        </div>

        <aside className="space-y-4">
          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Priority Queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ideas
                .filter((idea) => idea.status !== "archived")
                .sort((left, right) => right.impact - left.impact)
                .slice(0, 4)
                .map((idea) => (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => {
                      setSelectedIdeaId(idea.id);
                      router.push(`/ideas?ideaId=${encodeURIComponent(idea.id)}`);
                    }}
                    className="flex w-full items-center justify-between rounded-md border border-zinc-900 bg-zinc-950/60 px-3 py-2 text-left text-sm text-zinc-200 hover:border-zinc-700"
                  >
                    <span className="line-clamp-1">{idea.title}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-500" />
                  </button>
                ))}
            </CardContent>
          </Card>

          <Card className="border-zinc-900 bg-zinc-950/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Signals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-zinc-300">
              <div className="flex items-start gap-2 rounded-md border border-zinc-900 bg-zinc-950/60 p-3">
                <Sparkles className="mt-0.5 h-4 w-4 text-emerald-400" />
                <p>Most-voted idea is ready for implementation this sprint.</p>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-zinc-900 bg-zinc-950/60 p-3">
                <Target className="mt-0.5 h-4 w-4 text-blue-400" />
                <p>Two draft ideas can be merged based on linked graph overlap.</p>
              </div>
              <div className="flex items-start gap-2 rounded-md border border-zinc-900 bg-zinc-950/60 p-3">
                <Lightbulb className="mt-0.5 h-4 w-4 text-amber-400" />
                <p>Consider moving archived maintenance ideas to a quarterly track.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      {createOpen ? <NewIdeaModal onClose={() => setCreateOpen(false)} onCreate={createIdea} /> : null}

      {selectedIdea ? (
        <IdeaDetailModal
          idea={selectedIdea}
          onClose={() => {
            setSelectedIdeaId(null);
            router.replace("/ideas");
          }}
          onVote={() => handleVoteIdea(selectedIdea.id)}
          onConvert={() => convertToTask(selectedIdea.id)}
          onAddComment={(message) => addComment(selectedIdea.id, message)}
          onAddDependency={handleAddDependency}
          onRemoveDependency={(depId) => handleRemoveDependency(selectedIdea.id, depId)}
          onEdit={() => handleEditIdea(selectedIdea.id)}
          onDelete={() => handleDeleteIdea(selectedIdea.id)}
        />
      ) : null}

      {selectedIdea && dependenciesOpen && (
        <DependencyModal
          isOpen={dependenciesOpen}
          onClose={() => setDependenciesOpen(false)}
          onSave={(deps) => handleSaveDependencies(selectedIdea.id, deps)}
          currentIdeaId={selectedIdea.id}
          ideas={ideas}
          tasks={tasksList}
          existingDependencies={selectedIdea.dependencies}
        />
      )}
    </div>
  );
}