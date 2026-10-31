"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Columns3,
  Edit2,
  GitBranch,
  Lightbulb,
  List,
  Plus,
  Search,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { buildIdeaUpdate, diffIds, type IdeaStatus } from "@/components/features/idea-edit";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useIdeaComments } from "@/hooks/useIdeaComments";
import { useIdeaDependencies } from "@/hooks/useIdeaDependencies";
import { IdeaDTO, useConvertIdeaMutation, useCreateIdeaMutation, useDeleteIdeaMutation, useIdeasQuery, useUpdateIdeaMutation, useVoteIdeaMutation } from "@/hooks/useIdeas";
import { useWorkspaceMembersQuery } from "@/hooks/useWorkspaceMembers";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

type ViewMode = "board" | "list" | "mindmap";

type IdeaRecord = {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: IdeaStatus;
  authorId: string | null;
  author: string;
  tags: string[];
  votes: number;
  votedByMe: boolean;
  impact: number;
  createdAt: string;
  convertedTaskId?: string;
  relatedIdeaIds: string[];
};

const statusColumns: Array<{ id: IdeaStatus; label: string }> = [
  { id: "draft", label: "Draft" },
  { id: "validated", label: "Validated" },
  { id: "archived", label: "Archived" },
  { id: "converted", label: "Converted" },
];


function IdeaLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6">
        <div className="space-y-4">
          <div className="h-8 w-32 rounded bg-[var(--color-border-secondary)]" />
          <div className="h-4 w-48 rounded bg-[var(--color-border-secondary)]" />
          <div className="flex gap-2">
            <div className="h-8 w-20 rounded bg-[var(--color-border-secondary)]" />
            <div className="h-8 w-20 rounded bg-[var(--color-border-secondary)]" />
            <div className="h-8 w-20 rounded bg-[var(--color-border-secondary)]" />
          </div>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6">
            <div className="h-4 w-20 rounded bg-[var(--color-border-secondary)]" />
            <div className="mt-3 h-8 w-16 rounded bg-[var(--color-border-secondary)]" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {["Draft", "Validated", "Archived", "Converted"].map((col) => (
          <div key={col} className="space-y-3 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3">
            <div className="h-5 w-16 rounded bg-[var(--color-border-secondary)]" />
            {[1, 2].map((i) => (
              <div key={i} className="h-40 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-hover)]" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function IdeaEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-surface)] py-16 text-center">
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-[var(--color-surface-hover)] p-4">
            <svg className="h-8 w-8 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3 3 0 1014 13h3m-10 0a3 3 0 11-.707-5.657l.707-.707" />
            </svg>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">No ideas yet</h3>
          <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">Capture your first idea</p>
        </div>
        <button
          onClick={onCreate}
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-[var(--color-on-accent)] transition-colors hover:bg-[var(--color-accent-strong)]"
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

function formatCommentTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toIdeaRecord(idea: IdeaDTO, previous: IdeaRecord | undefined, authorName: string | undefined): IdeaRecord {
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
    authorId: idea.authorId,
    author: authorName ?? "Teammate",
    tags: previous?.tags ?? ["Idea"],
    votes: previous?.votes ?? 0,
    votedByMe: previous?.votedByMe ?? false,
    impact: previous?.impact ?? 5,
    createdAt,
    convertedTaskId: idea.convertedTaskId ?? undefined,
    relatedIdeaIds: previous?.relatedIdeaIds ?? [],
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
          ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/10 text-[var(--color-success)]"
          : "border-[var(--color-border-secondary)] bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-tertiary)]",
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
    <Card className="min-w-0 border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
      <CardHeader className="space-y-3 p-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <button type="button" onClick={onOpen} className="min-w-0 break-words text-left">
            <CardTitle className="text-base leading-5 hover:text-[var(--color-text-primary)]">{idea.title}</CardTitle>
          </button>
          <Badge variant={statusBadge(idea.status)} className="shrink-0">{idea.status}</Badge>
        </div>
        <p className="text-sm text-[var(--color-text-secondary)]">{idea.summary}</p>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {idea.tags.map((tag) => (
            <Badge key={tag} variant="default">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-tertiary)]">
          <div className="rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2 py-1.5">Impact {idea.impact}/10</div>
          <div className="rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2 py-1.5">{idea.createdAt}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
            <Avatar className="h-6 w-6">
              <AvatarFallback>{idea.author.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {idea.author}
          </div>
          <VoteButton votes={idea.votes} voted={idea.votedByMe} onToggle={onVote} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
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
  ideaId,
  nameFor,
}: {
  ideaId: string;
  nameFor: (userId: string) => string;
}) {
  const { comments, isLoading, addComment, isAdding } = useIdeaComments(ideaId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!value) return;
    setError(null);
    addComment(value, {
      onSuccess: () => setDraft(""),
      onError: (err) => setError(err instanceof Error ? err.message : "Unable to add comment"),
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--color-text-primary)]">Comments</p>
      <div className="max-h-48 space-y-2 overflow-auto pr-1">
        {isLoading ? (
          <p className="px-3 py-2 text-sm text-[var(--color-text-tertiary)]">Loading comments...</p>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[var(--color-text-primary)]">{nameFor(comment.authorId)}</p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">{formatCommentTime(comment.createdAt)}</p>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">{comment.body}</p>
            </div>
          ))
        ) : (
          <p className="rounded-md border border-dashed border-[var(--color-border-secondary)] px-3 py-2 text-sm text-[var(--color-text-tertiary)]">
            No comments yet.
          </p>
        )}
      </div>
      <form onSubmit={submitComment} className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a comment"
          aria-label="Add a comment"
        />
        <Button type="submit" size="sm" disabled={isAdding || !draft.trim()}>
          {isAdding ? "Adding..." : "Add"}
        </Button>
      </form>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
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
      <Card className="w-full max-w-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
        <CardHeader className="border-b border-[var(--color-border-secondary)] pb-4">
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
              className="min-h-[120px] w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
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
                className="h-9 rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]"
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

function DependencyModal({
  onClose,
  onSave,
  currentIdeaId,
  ideas,
  existingIds,
  isSaving,
}: {
  onClose: () => void;
  onSave: (selectedIds: string[]) => void;
  currentIdeaId: string;
  ideas: IdeaRecord[];
  existingIds: string[];
  isSaving: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>(existingIds);

  const filteredIdeas = ideas
    .filter((idea) => idea.id !== currentIdeaId)
    .filter((idea) => search === "" || idea.title.toLowerCase().includes(search.toLowerCase()));

  const toggleItem = (id: string) => {
    setSelected((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
        <DialogHeader>
          <DialogTitle>Dependencies</DialogTitle>
          <DialogDescription>Pick the ideas this one depends on.</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ideas..."
            aria-label="Search ideas"
            className="pl-9"
          />
        </div>

        <div className="max-h-64 space-y-2 overflow-y-auto">
          {filteredIdeas.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">No ideas found</p>
          ) : (
            filteredIdeas.map((idea) => {
              const isSelected = selected.includes(idea.id);
              return (
                <button
                  key={idea.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleItem(idea.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors",
                    isSelected ? "border-emerald-600 bg-[var(--color-success)]/10" : "border-[var(--color-border-secondary)] hover:border-[var(--color-border-tertiary)]",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded border",
                      isSelected ? "border-emerald-500 bg-emerald-500" : "border-[var(--color-border-tertiary)]",
                    )}
                  >
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[var(--color-text-primary)]">{idea.title}</p>
                    <p className="truncate text-xs text-[var(--color-text-tertiary)]">{idea.summary}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(selected)} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditIdeaModal({
  idea,
  onClose,
}: {
  idea: IdeaRecord;
  onClose: () => void;
}) {
  const updateIdea = useUpdateIdeaMutation();
  const [title, setTitle] = useState(idea.title);
  const [summary, setSummary] = useState(idea.summary);
  const [content, setContent] = useState(idea.content);
  const [status, setStatus] = useState<IdeaStatus>(idea.status);
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = buildIdeaUpdate(idea, { title, summary, content, status });
    if ("error" in payload) {
      setError(payload.error);
      return;
    }
    if (!payload.changes) {
      onClose();
      return;
    }
    setError(null);
    updateIdea.mutate(
      { id: idea.id, ...payload.changes },
      {
        onSuccess: onClose,
        onError: (err) => setError(err instanceof Error ? err.message : "Unable to save idea"),
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
        <DialogHeader>
          <DialogTitle>Edit idea</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1 text-sm text-[var(--color-text-secondary)]">
            <span>Title</span>
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required minLength={2} autoFocus />
          </label>
          <label className="block space-y-1 text-sm text-[var(--color-text-secondary)]">
            <span>Summary</span>
            <Input value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
          <label className="block space-y-1 text-sm text-[var(--color-text-secondary)]">
            <span>Details</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              className="min-h-[140px] w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            />
          </label>
          <label className="block space-y-1 text-sm text-[var(--color-text-secondary)]">
            <span>Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as IdeaStatus)}
              className="h-9 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]"
            >
              {statusColumns.map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
            </select>
          </label>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateIdea.isPending}>
              {updateIdea.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function IdeaDetailModal({
  idea,
  ideas,
  nameFor,
  onClose,
  onVote,
  onConvert,
  onEdit,
  onDelete,
}: {
  idea: IdeaRecord;
  ideas: IdeaRecord[];
  nameFor: (userId: string) => string;
  onClose: () => void;
  onVote: () => void;
  onConvert: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { dependencies, addDependency, removeDependency, isAdding, isRemoving } = useIdeaDependencies(idea.id);
  const [dependenciesOpen, setDependenciesOpen] = useState(false);
  const [dependencyError, setDependencyError] = useState<string | null>(null);

  async function saveDependencies(selectedIds: string[]) {
    const { toAdd, toRemove } = diffIds(dependencies.map((d) => d.id), selectedIds);
    setDependencyError(null);
    try {
      await Promise.all([
        ...toAdd.map((id) => addDependency(id)),
        ...toRemove.map((id) => removeDependency(id)),
      ]);
      setDependenciesOpen(false);
    } catch (err) {
      setDependencyError(err instanceof Error ? err.message : "Unable to update dependencies");
    }
  }

  function handleRemove(id: string) {
    setDependencyError(null);
    removeDependency(id).catch((err: unknown) =>
      setDependencyError(err instanceof Error ? err.message : "Unable to remove dependency"),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <Card className="max-h-[92vh] w-full max-w-4xl overflow-auto border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
        <CardHeader className="border-b border-[var(--color-border-secondary)] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant={statusBadge(idea.status)}>{idea.status}</Badge>
                <Badge variant="default">Impact {idea.impact}/10</Badge>
              </div>
              <CardTitle className="mt-3 text-2xl">{idea.title}</CardTitle>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{idea.summary}</p>
            </div>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-4">
            <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-[var(--color-text-secondary)]">
                <p className="whitespace-pre-wrap">{idea.content}</p>
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
              <CardContent className="p-4">
                <CommentThread ideaId={idea.id} nameFor={nameFor} />
              </CardContent>
            </Card>

            {dependencies.length > 0 || dependencyError ? (
              <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Depends on</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className="flex items-center justify-between rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface-hover)] px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-400" />
                        <span className="text-sm text-[var(--color-text-primary)]">{dep.title}</span>
                        <Badge variant={statusBadge(dep.status)} className="text-xs">
                          {dep.status}
                        </Badge>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemove(dep.id)}
                        disabled={isRemoving}
                        aria-label={`Remove dependency ${dep.title}`}
                        className="rounded-full p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {dependencyError ? <p className="text-xs text-red-400">{dependencyError}</p> : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-3">
            <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <VoteButton votes={idea.votes} voted={idea.votedByMe} onToggle={onVote} />
                <Button className="w-full justify-start" onClick={onConvert} disabled={idea.status === "converted"}>
                  <CheckCircle2 className="h-4 w-4" />
                  {idea.status === "converted" ? "Already Converted" : "Convert to Task"}
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={() => setDependenciesOpen(true)}>
                  <GitBranch className="h-4 w-4" />
                  Edit Dependencies
                </Button>
                <Button className="w-full justify-start" variant="secondary" onClick={onEdit}>
                  <Edit2 className="h-4 w-4" />
                  Edit Idea
                </Button>
                <Button
                  className="w-full justify-start bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20"
                  variant="secondary"
                  onClick={onDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Idea
                </Button>
              </CardContent>
            </Card>

            <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                <div className="flex items-center justify-between">
                  <span>Author</span>
                  <span className="text-[var(--color-text-primary)]">{idea.author}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Created</span>
                  <span className="text-[var(--color-text-primary)]">{idea.createdAt}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="text-[var(--color-text-primary)]">{idea.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Task Link</span>
                  <span className="text-[var(--color-text-primary)]">{idea.convertedTaskId ?? "Not converted"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dependencies</span>
                  <span className="text-[var(--color-text-primary)]">{dependencies.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {dependenciesOpen ? (
        <DependencyModal
          onClose={() => setDependenciesOpen(false)}
          onSave={saveDependencies}
          currentIdeaId={idea.id}
          ideas={ideas}
          existingIds={dependencies.map((d) => d.id)}
          isSaving={isAdding || isRemoving}
        />
      ) : null}
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
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {statusColumns.map((column) => {
        const columnIdeas = ideas.filter((idea) => idea.status === column.id);

        return (
          <section key={column.id} className="space-y-3 rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-secondary)]">{column.label}</h2>
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
                <p className="rounded-lg border border-dashed border-[var(--color-border-secondary)] px-3 py-4 text-sm text-[var(--color-text-tertiary)]">No ideas</p>
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
    <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border-secondary)] pb-4">
        <CardTitle className="text-xl">Ideas List</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[var(--color-surface)] text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Impact</th>
              <th className="px-4 py-3">Votes</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => (
              <tr key={idea.id} className="border-t border-[var(--color-border-secondary)] text-[var(--color-text-primary)]">
                <td className="px-4 py-3">
                  <button type="button" onClick={() => onOpen(idea.id)} className="text-left hover:text-[var(--color-text-primary)]">
                    <p className="font-medium">{idea.title}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">{idea.tags.join(" . ")}</p>
                  </button>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadge(idea.status)}>{idea.status}</Badge>
                </td>
                <td className="px-4 py-3">{idea.impact}/10</td>
                <td className="px-4 py-3">
                  <VoteButton votes={idea.votes} voted={idea.votedByMe} onToggle={() => onVote(idea.id)} />
                </td>
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
    <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
      <CardHeader className="border-b border-[var(--color-border-secondary)] pb-4">
        <CardTitle className="text-xl">Mind Map</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="relative h-[560px] overflow-auto rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
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
              className="absolute top-3 text-xs text-[var(--color-text-tertiary)]"
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
                className="absolute w-[165px] rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-hover)] px-3 py-2 text-left transition-colors hover:border-[var(--color-border-tertiary)]"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
              >
                <p className="line-clamp-2 text-sm font-medium text-[var(--color-text-primary)]">{idea.title}</p>
                <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Impact {idea.impact}/10</p>
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
  const [editOpen, setEditOpen] = useState(false);
  const { userId } = useSessionContext();
  const ideasQuery = useIdeasQuery();
  const membersQuery = useWorkspaceMembersQuery();
  const createIdeaMutation = useCreateIdeaMutation();
  const convertIdeaMutation = useConvertIdeaMutation();
  const deleteIdeaMutation = useDeleteIdeaMutation();
  const voteIdeaMutation = useVoteIdeaMutation();
  const apiEnabled = ideasQuery.isSuccess;
  const isLoading = ideasQuery.isLoading;
  const isError = ideasQuery.isError;
  const showEmptyState = ideasQuery.isSuccess && ideasQuery.data?.length === 0;

  const memberNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const member of membersQuery.data ?? []) {
      names.set(member.user.id, member.user.fullName || member.user.email);
    }
    return names;
  }, [membersQuery.data]);

  const nameFor = useCallback(
    (id: string) => (id === userId ? "You" : memberNames.get(id) ?? "Teammate"),
    [memberNames, userId],
  );

  useEffect(() => {
    if (!ideasQuery.data) return;

    setIdeas((current) => {
      const previousById = new Map(current.map((idea) => [idea.id, idea]));
      return ideasQuery.data.map((idea) => toIdeaRecord(idea, previousById.get(idea.id), nameFor(idea.authorId)));
    });
  }, [ideasQuery.data, nameFor]);

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
      const matchesMine = !myIdeasOnly || idea.authorId === userId;
      return matchesSearch && matchesStatus && matchesMine;
    });
  }, [ideas, myIdeasOnly, search, statusFilter, userId]);

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
      authorId: userId,
      author: "You",
      tags: payload.tags,
      votes: 1,
      votedByMe: true,
      impact: 6,
      createdAt: "Now",
      relatedIdeaIds: [],
    };

    setIdeas((current) => [newIdea, ...current]);
    setSelectedIdeaId(newIdea.id);
    router.push(`/ideas?ideaId=${encodeURIComponent(newIdea.id)}`);
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


  return (
    <div className="space-y-6 page-animate">
      <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)]">Ideas</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">Idea workspace</h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)]">
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
                      ? "border-[var(--color-border-tertiary)] bg-[var(--color-surface-hover)] text-[var(--color-text-primary)]"
                      : "border-[var(--color-border-secondary)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-tertiary)] hover:text-[var(--color-text-primary)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {view.label}
                </button>
              );
            })}

            <div className="ml-auto grid w-full gap-2 md:w-auto md:grid-cols-[320px_auto_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-tertiary)]" />
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
                className="h-9 rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-primary)]"
              >
                <option value="all">All Statuses</option>
                {statusColumns.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.label}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-2 rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
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
        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
          <CardHeader className="pb-3">
            <p className="text-sm text-[var(--color-text-secondary)]">Active Ideas</p>
            <CardTitle className="text-3xl">{ideas.filter((idea) => idea.status !== "archived").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">{ideas.length} in total</CardContent>
        </Card>
        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
          <CardHeader className="pb-3">
            <p className="text-sm text-[var(--color-text-secondary)]">Validated</p>
            <CardTitle className="text-3xl">{ideas.filter((idea) => idea.status === "validated").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">Ready for conversion</CardContent>
        </Card>
        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
          <CardHeader className="pb-3">
            <p className="text-sm text-[var(--color-text-secondary)]">Converted</p>
            <CardTitle className="text-3xl">{ideas.filter((idea) => idea.status === "converted").length}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">Linked to task flow</CardContent>
        </Card>
        <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
          <CardHeader className="pb-3">
            <p className="text-sm text-[var(--color-text-secondary)]">Average Impact</p>
            <CardTitle className="text-3xl">
              {Math.round(ideas.reduce((accumulator, idea) => accumulator + idea.impact, 0) / Math.max(1, ideas.length))}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--color-text-secondary)]">Across all active lanes</CardContent>
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
          <Card className="border-[var(--color-border-secondary)] bg-[var(--color-surface)]">
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
                    className="flex w-full items-center justify-between rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:border-[var(--color-border-tertiary)]"
                  >
                    <span className="line-clamp-1">{idea.title}</span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                  </button>
                ))}
            </CardContent>
          </Card>

        </aside>
      </div>

      {createOpen ? <NewIdeaModal onClose={() => setCreateOpen(false)} onCreate={createIdea} /> : null}

      {selectedIdea ? (
        <IdeaDetailModal
          idea={selectedIdea}
          ideas={ideas}
          nameFor={nameFor}
          onClose={() => {
            setSelectedIdeaId(null);
            router.replace("/ideas");
          }}
          onVote={() => handleVoteIdea(selectedIdea.id)}
          onConvert={() => convertToTask(selectedIdea.id)}
          onEdit={() => setEditOpen(true)}
          onDelete={() => handleDeleteIdea(selectedIdea.id)}
        />
      ) : null}

      {selectedIdea && editOpen ? <EditIdeaModal idea={selectedIdea} onClose={() => setEditOpen(false)} /> : null}
    </div>
  );
}