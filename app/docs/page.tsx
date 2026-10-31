"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  Clock,
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Plus,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { useCreateDocumentMutation, useDocumentsQuery, type DocumentDTO } from "@/hooks/useDocuments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const FOLDERS = ["All", "Engineering", "Product", "Operations", "General"];

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useDocumentsQuery();
  const createDocument = useCreateDocumentMutation();

  const [activeFolder, setActiveFolder] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [folder, setFolder] = useState("Engineering");
  const [author, setAuthor] = useState("Alex Chen");

  const filteredDocs = useMemo(() => {
    let list = [...documents];

    if (activeFolder !== "All") {
      list = list.filter((d) => d.folder.toLowerCase() === activeFolder.toLowerCase());
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.content.toLowerCase().includes(q) ||
          d.author.toLowerCase().includes(q),
      );
    }

    return list;
  }, [documents, activeFolder, searchQuery]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createDocument.mutateAsync({
      title: title.trim(),
      folder,
      author,
    });

    setIsModalOpen(false);
    setTitle("");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
            Knowledge Base & Docs
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] sm:text-sm">
            Centralized documentation, engineering RFCs, product requirements, and team wikis.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Document</span>
          </Button>
        </div>
      </div>

      {/* Filter and Folder Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--color-border-secondary)] pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {FOLDERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFolder(f)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap",
                activeFolder === f
                  ? "bg-[var(--color-accent)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <Input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-[var(--color-surface-strong)]"
          />
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)]/40 py-16 text-center">
            <BookOpen className="h-10 w-10 text-[var(--color-accent)]" />
            <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
              No Documents Found
            </h3>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-sm">
              Create your first documentation page or engineering spec to share knowledge across your squad.
            </p>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 gap-1.5 bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Document</span>
            </Button>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const wordCount = doc.content.split(/\s+/).length;
            const readMinutes = Math.max(1, Math.ceil(wordCount / 200));

            return (
              <Link
                key={doc.id}
                href={`/docs/${doc.id}`}
                className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-5 shadow-xs hover:border-[var(--color-accent)]/50 hover:bg-[var(--color-surface-hover)] hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)] shadow-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize font-medium py-0 px-2">
                      {doc.folder}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-sm font-bold tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="mt-2 text-xs text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                    {doc.content.replace(/^[#*-\s]+/gm, "")}
                  </p>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-secondary)] pt-3 text-[11px] text-[var(--color-text-tertiary)]">
                  <span>Author: <strong>{doc.author}</strong></span>
                  <span>{readMinutes} min read</span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Create Document Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent-soft)] text-[var(--color-accent)]">
                  <FileText className="h-4 w-4" />
                </div>
                <Dialog.Title className="text-base font-semibold text-[var(--color-text-primary)]">
                  Create New Document
                </Dialog.Title>
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="text-xs text-[var(--color-text-secondary)] mb-4">
              Create a document, spec, or notes page for your organization knowledge base.
            </Dialog.Description>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Document Title *
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus Architecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs bg-[var(--color-surface-strong)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
                  Folder Category
                </label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] p-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-hidden"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="Operations">Operations</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline" size="sm" className="text-xs">
                    Cancel
                  </Button>
                </Dialog.Close>
                <Button
                  type="submit"
                  disabled={createDocument.isPending || !title.trim()}
                  className="bg-[var(--color-accent)] text-white text-xs font-semibold hover:opacity-90 shadow-xs"
                >
                  {createDocument.isPending ? "Creating..." : "Create Document"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
