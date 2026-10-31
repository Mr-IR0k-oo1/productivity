"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RichTextEditorProps {
  initialContent?: Record<string, unknown> | null;
  onSave: (content: Record<string, unknown>) => void;
  title?: string;
  minHeight?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  initialContent,
  onSave,
  title = "Notes",
  minHeight = "min-h-[180px]",
  readOnly = false,
}: RichTextEditorProps) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent || undefined,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      // Clear any pending save
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current!);
      }

      // Debounce autosave for 1 second
      debounceTimerRef.current = setTimeout(() => {
        const json = editor.getJSON();
        onSave(json);
      }, 1000);
    },
  });

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`${minHeight} rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-3 prose prose-invert max-w-none`}>
          <EditorContent editor={editor} />
        </div>
        {editor && !readOnly && (
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              disabled={!editor.can().chain().focus().toggleBold().run()}
              className={`px-2 py-1 text-sm rounded ${
                editor.isActive("bold")
                  ? "bg-[var(--color-border-tertiary)] text-white"
                  : "bg-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Bold
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              disabled={!editor.can().chain().focus().toggleItalic().run()}
              className={`px-2 py-1 text-sm rounded ${
                editor.isActive("italic")
                  ? "bg-[var(--color-border-tertiary)] text-white"
                  : "bg-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Italic
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
              className={`px-2 py-1 text-sm rounded ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-[var(--color-border-tertiary)] text-white"
                  : "bg-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              disabled={!editor.can().chain().focus().toggleBulletList().run()}
              className={`px-2 py-1 text-sm rounded ${
                editor.isActive("bulletList")
                  ? "bg-[var(--color-border-tertiary)] text-white"
                  : "bg-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Bullet List
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
              className={`px-2 py-1 text-sm rounded ${
                editor.isActive("codeBlock")
                  ? "bg-[var(--color-border-tertiary)] text-white"
                  : "bg-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              Code
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
