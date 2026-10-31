export type IdeaStatus = "draft" | "validated" | "archived" | "converted";

type EditableIdea = { title: string; summary: string; content: string; status: IdeaStatus };

export type IdeaChanges = Partial<{ title: string; summary: string | null; content: string | null; status: IdeaStatus }>;

/** Returns only the fields that changed, or an error the form should show. */
export function buildIdeaUpdate(
  original: EditableIdea,
  draft: EditableIdea,
): { error: string } | { changes: IdeaChanges | null } {
  const title = draft.title.trim();
  if (title.length < 2) {
    return { error: "Title needs at least 2 characters." };
  }

  const summary = draft.summary.trim();
  const content = draft.content.trim();
  const changes: IdeaChanges = {};

  if (title !== original.title) changes.title = title;
  if (summary !== original.summary.trim()) changes.summary = summary || null;
  if (content !== original.content.trim()) changes.content = content || null;
  if (draft.status !== original.status) changes.status = draft.status;

  return { changes: Object.keys(changes).length > 0 ? changes : null };
}

/** Works out which links to add and remove to go from `current` to `next`. */
export function diffIds(current: string[], next: string[]) {
  const currentSet = new Set(current);
  const nextSet = new Set(next);
  return {
    toAdd: next.filter((id) => !currentSet.has(id)),
    toRemove: current.filter((id) => !nextSet.has(id)),
  };
}
