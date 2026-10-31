"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  FileText,
  Save,
  Share2,
  Sparkles,
} from "lucide-react";

import { useDocumentQuery, useUpdateDocumentMutation } from "@/hooks/useDocuments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const docId = resolvedParams.id;

  const { data: document, isLoading } = useDocumentQuery(docId);
  const updateDocument = useUpdateDocumentMutation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [copied, setCopied] = useState(false);
  const [hasInit, setHasInit] = useState(false);

  useEffect(() => {
    if (document && !hasInit) {
      setTitle(document.title);
      setContent(document.content);
      setHasInit(true);
    }
  }, [document, hasInit]);

  const handleSave = async () => {
    if (!docId) return;
    await updateDocument.mutateAsync({
      id: docId,
      title: title.trim(),
      content,
    });
  };

  const handleCopy = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <FileText className="mx-auto h-10 w-10 text-[var(--color-accent)]" />
        <h2 className="mt-3 text-lg font-bold text-[var(--color-text-primary)]">Document Not Found</h2>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
          The requested document does not exist or has been removed.
        </p>
        <Link href="/docs">
          <Button variant="outline" size="sm" className="mt-4 text-xs">
            Back to Documents
          </Button>
        </Link>
      </div>
    );
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top action bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-secondary)] pb-3">
        <Link
          href="/docs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Knowledge Base</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="h-8 gap-1.5 text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "Copied" : "Copy Markdown"}</span>
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateDocument.isPending}
            className="h-8 gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{updateDocument.isPending ? "Saving..." : "Save Changes"}</span>
          </Button>
        </div>
      </div>

      {/* Document Meta Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-2">
            {document.folder}
          </Badge>
          <span className="text-[11px] text-[var(--color-text-tertiary)]">
            Author: <strong>{document.author}</strong> • {wordCount} words • {readTime} min read
          </span>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document Title"
          className="w-full bg-transparent text-2xl font-extrabold tracking-tight text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-hidden sm:text-3xl"
        />
      </div>

      {/* Rich Editor Surface */}
      <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-5 shadow-xs">
        <textarea
          rows={22}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write markdown content, engineering specifications, or sprint notes here..."
          className="w-full bg-transparent font-mono text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] outline-hidden leading-relaxed resize-y"
        />
      </div>
    </div>
  );
}
