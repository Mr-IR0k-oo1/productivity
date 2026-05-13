"use client";

import { useUpdateIdeaMutation } from "@/hooks/useIdeas";
import { RichTextEditor } from "./RichTextEditor";

interface IdeaContentEditorProps {
  ideaId: string;
  initialContent?: Record<string, unknown> | string | null;
  readOnly?: boolean;
}

export function IdeaContentEditor({
  ideaId,
  initialContent,
  readOnly = false,
}: IdeaContentEditorProps) {
  const updateIdeaMutation = useUpdateIdeaMutation();

  const handleSave = (content: Record<string, unknown>) => {
    updateIdeaMutation.mutate({
      id: ideaId,
      content,
    });
  };

  // Convert string content to TipTap JSON if needed
  const tiptapContent =
    typeof initialContent === "string"
      ? {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: initialContent,
                },
              ],
            },
          ],
        }
      : (initialContent as Record<string, unknown> | undefined);

  return (
    <RichTextEditor
      initialContent={tiptapContent}
      onSave={handleSave}
      title="Idea Notes"
      minHeight="min-h-[200px]"
      readOnly={readOnly}
    />
  );
}
