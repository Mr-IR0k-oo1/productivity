"use client";

import { useUpdateTaskMutation } from "@/hooks/useTasks";
import { RichTextEditor } from "./RichTextEditor";

interface TaskDescriptionEditorProps {
  taskId: string;
  initialContent?: Record<string, unknown> | string | null;
  readOnly?: boolean;
}

export function TaskDescriptionEditor({
  taskId,
  initialContent,
  readOnly = false,
}: TaskDescriptionEditorProps) {
  const updateTaskMutation = useUpdateTaskMutation();

  const handleSave = (content: Record<string, unknown>) => {
    updateTaskMutation.mutate({
      id: taskId,
      description: content,
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
      title="Task Description"
      minHeight="min-h-[200px]"
      readOnly={readOnly}
    />
  );
}
