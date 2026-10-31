"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function CommentDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (content: string) => Promise<void> | void;
}) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = content.trim();
    if (!value) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onSubmit(value);
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Unable to add comment");
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add comment</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.currentTarget.form?.requestSubmit();
              }
            }}
            aria-label="Comment"
            placeholder="Write a comment"
            autoFocus
            className="min-h-[100px] w-full rounded-md border border-[var(--color-border-secondary)] bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          />
          {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!content.trim() || isSubmitting}>
              {isSubmitting ? "Adding..." : "Comment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
