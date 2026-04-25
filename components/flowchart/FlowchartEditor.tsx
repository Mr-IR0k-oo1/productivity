"use client";

import { ArrowLeft, MessageSquare, Save, Share2, Undo2, Redo2, Square, Infinity as InfinityIcon, PanelRightClose, PanelRightOpen, FolderGit2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactFlowInstance } from "@xyflow/react";
import { toast } from "sonner";

import CommentPin from "@/components/flowchart/CommentPin";
import DiagramTypeSelector from "@/components/flowchart/DiagramTypeSelector";
import ExportDropdown from "@/components/flowchart/ExportDropdown";
import FlowchartCanvas from "@/components/flowchart/FlowchartCanvas";
import RemoteCursors from "@/components/flowchart/RemoteCursors";
import ShareModal from "@/components/flowchart/ShareModal";
import VersionHistoryPanel from "@/components/flowchart/VersionHistoryPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSessionContext } from "@/components/providers/SessionProvider";
import {
  useFlowchart,
  usePublicFlowchart,
  useUpdateFlowchart,
} from "@/hooks/useFlowchart";
import { useFlowchartAutosave } from "@/hooks/useFlowchartAutosave";
import { useAddComment, useComments } from "@/hooks/useFlowchartComments";
import { useFlowchartExport } from "@/hooks/useFlowchartExport";
import { useShareFlowchart } from "@/hooks/useFlowchartShare";
import { useAutoSaveVersion, useRestoreVersion, useSaveVersion, useVersions } from "@/hooks/useFlowchartVersions";
import { buildTemplateCanvas } from "@/lib/flowchart/templates";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { FlowchartComment, OrbitEdge, OrbitNode } from "@/types/flowchart";

type FlowchartEditorProps = {
  flowchartId?: string;
  publicToken?: string;
};

function userColorFromId(userId: string | null) {
  if (!userId) {
    return "#60a5fa";
  }

  const palette = ["#60a5fa", "#34d399", "#f59e0b", "#f472b6", "#a78bfa"];
  const index = userId
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

function flattenComments(comments: FlowchartComment[]): FlowchartComment[] {
  return comments.flatMap((comment) => [comment, ...(comment.replies ? flattenComments(comment.replies) : [])]);
}

export default function FlowchartEditor({ flowchartId, publicToken }: FlowchartEditorProps) {
  const { userId, workspaceRole } = useSessionContext();
  const privateQuery = useFlowchart(flowchartId ?? null);
  const publicQuery = usePublicFlowchart(publicToken ?? null);
  const flowchart = publicToken ? publicQuery.data : privateQuery.data;
  const isLoading = publicToken ? publicQuery.isLoading : privateQuery.isLoading;
  const isError = publicToken ? publicQuery.isError : privateQuery.isError;
  const updateFlowchart = useUpdateFlowchart(flowchartId ?? "");
  const { statusLabel } = useFlowchartAutosave(publicToken ? null : flowchartId ?? null);
  const { exportToJson, exportToPdf, exportToPng, exportToSvg } = useFlowchartExport();
  const commentsQuery = useComments(publicToken ? null : flowchartId ?? null);
  const addComment = useAddComment(flowchartId ?? "");
  const share = useShareFlowchart(flowchartId ?? "", flowchart?.publicToken ?? null);
  const versionsQuery = useVersions(publicToken ? null : flowchartId ?? null);
  const saveVersion = useSaveVersion(flowchartId ?? "");
  const restoreVersion = useRestoreVersion(flowchartId ?? "");
  const loadCanvas = useFlowchartStore((state) => state.loadCanvas);
  const viewport = useFlowchartStore((state) => state.viewport);
  const selectedNodeIds = useFlowchartStore((state) => state.selectedNodeIds);
  const selectedEdgeIds = useFlowchartStore((state) => state.selectedEdgeIds);
  const nodes = useFlowchartStore((state) => state.nodes);
  const edges = useFlowchartStore((state) => state.edges);
  const mode = useFlowchartStore((state) => state.mode);
  const setMode = useFlowchartStore((state) => state.setMode);
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const updateEdge = useFlowchartStore((state) => state.updateEdge);
  const deleteNode = useFlowchartStore((state) => state.deleteNode);
  const toggleComments = useFlowchartStore((state) => state.toggleComments);
  const showComments = useFlowchartStore((state) => state.showComments);
  const showVersions = useFlowchartStore((state) => state.showVersions);
  const toggleVersions = useFlowchartStore((state) => state.toggleVersions);
  const activeTool = useFlowchartStore((state) => state.activeTool);
  const setActiveTool = useFlowchartStore((state) => state.setActiveTool);
  const activeShapeVariant = useFlowchartStore((state) => state.activeShapeVariant);
  const setActiveShapeVariant = useFlowchartStore((state) => state.setActiveShapeVariant);
  const remoteUsers = useFlowchartStore((state) => Array.from(state.remoteUsers.values()));
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const reactFlowRef = useRef<ReactFlowInstance<OrbitNode, OrbitEdge> | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const [diagramSelectorOpen, setDiagramSelectorOpen] = useState(false);

  useAutoSaveVersion(publicToken ? null : flowchartId ?? null);

  useEffect(() => {
    if (!flowchart) {
      return;
    }

    loadCanvas(flowchart.canvasState, flowchart.mode);
    setTitleDraft(flowchart.title);
  }, [flowchart, loadCanvas]);

  const canEdit = useMemo(() => {
    if (publicToken || !flowchart) {
      return false;
    }

    return flowchart.ownerId === userId || workspaceRole === "owner" || workspaceRole === "admin";
  }, [flowchart, publicToken, userId, workspaceRole]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeIds[0]) ?? null,
    [nodes, selectedNodeIds],
  );
  const selectedEdge = useMemo(
    () => edges.find((edge) => edge.id === selectedEdgeIds[0]) ?? null,
    [edges, selectedEdgeIds],
  );

  const panelOpen = showVersions || Boolean(selectedNode) || Boolean(selectedEdge);
  const avatarColor = userColorFromId(userId);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-sm text-[var(--color-text-secondary)]">Loading flowchart...</div>
      </div>
    );
  }

  if (isError || !flowchart) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--color-background)]">
        <div className="text-sm text-[var(--color-text-secondary)]">Unable to load this flowchart.</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen flex-col bg-[var(--color-background)] md:hidden">
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-[var(--color-text-secondary)]">
          Flowcharts are best viewed on desktop screens.
        </div>
      </div>
      <div className="hidden h-screen flex-col bg-[var(--color-background)] md:flex">
        <div className="flex h-12 items-center justify-between border-b border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-3">
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" asChild>
              <Link href="/flowcharts">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Input
              value={titleDraft}
              onChange={(event) => setTitleDraft(event.target.value)}
              onBlur={() => {
                if (!publicToken && titleDraft.trim() && titleDraft !== flowchart.title) {
                  void updateFlowchart
                    .mutateAsync({ title: titleDraft.trim() })
                    .then(() => {
                      toast.success("Title updated");
                    })
                    .catch((error) => {
                      console.error("Failed to update flowchart title", error);
                      toast.error("Failed to update title");
                      setTitleDraft(flowchart.title);
                    });
                }
              }}
              disabled={!canEdit}
              className="h-8 w-[280px]"
            />
            <div className="text-xs text-[var(--color-text-secondary)]">{statusLabel}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="icon" onClick={() => useFlowchartStore.getState().undo()}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" onClick={() => useFlowchartStore.getState().redo()}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <div className="rounded-full border border-[var(--color-border-secondary)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
              {Math.round(viewport.zoom * 100)}%
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => void reactFlowRef.current?.fitView({ padding: 0.1 })}>
              Fit
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setMode(mode === "infinite" ? "page" : "infinite");
              }}
            >
              {mode === "infinite" ? <InfinityIcon className="h-4 w-4" /> : <Square className="h-4 w-4" />}
            </Button>
            {!publicToken ? (
              <>
                <Button type="button" variant="secondary" size="sm" onClick={() => setShareOpen(true)}>
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
                <ExportDropdown
                  onExport={(format) => {
                    if (!canvasRef.current) {
                      return;
                    }

                    if (format === "png") {
                      void exportToPng(canvasRef.current, flowchart.title);
                    } else if (format === "svg") {
                      void exportToSvg(canvasRef.current, flowchart.title);
                    } else if (format === "pdf") {
                      void exportToPdf(canvasRef.current, flowchart.title);
                    } else {
                      void exportToJson(flowchart.id);
                    }
                  }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={() => toggleComments()}>
                  <MessageSquare className="h-4 w-4" />
                  Comments
                </Button>
                <Button type="button" variant="secondary" size="sm" onClick={() => toggleVersions()}>
                  <FolderGit2 className="h-4 w-4" />
                  Versions
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    void saveVersion.mutateAsync("Manual checkpoint").then(() => {
                      toast.success("Version saved");
                    });
                  }}
                >
                  <Save className="h-4 w-4" />
                  Checkpoint
                </Button>
              </>
            ) : null}
            <div className="flex items-center gap-1">
              {remoteUsers.slice(0, 5).map((user) => (
                <div
                  key={user.userId}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border-secondary)] text-[10px] font-semibold text-white"
                  style={{ backgroundColor: user.avatarColor }}
                  title={user.userName}
                >
                  {user.userName.slice(0, 1).toUpperCase()}
                </div>
              ))}
              {remoteUsers.length > 5 ? (
                <div className="text-xs text-[var(--color-text-secondary)]">+{remoteUsers.length - 5}</div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="relative flex min-h-0 flex-1">
          <div className="flex w-12 flex-col items-center gap-2 border-r border-[var(--color-border-secondary)] bg-[var(--color-surface)] py-3">
            {([
              ["select", "V"],
              ["hand", "H"],
              ["shape", "S"],
              ["text", "T"],
              ["sticky", "K"],
              ["image", "I"],
              ["task_card", "T"],
              ["idea_card", "I"],
              ["group", "G"],
              ["code", "C"],
              ["connector", "C"],
              ["comment", "M"],
            ] as const).map(([tool, shortcut]) => (
              <button
                key={`${tool}-${shortcut}`}
                type="button"
                className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold ${
                  activeTool === tool
                    ? "border-[var(--color-accent)] bg-[var(--color-surface-strong)] text-[var(--color-text-primary)]"
                    : "border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-secondary)]"
                }`}
                onClick={() => {
                  if (tool === "shape") {
                    const order = ["rectangle", "diamond", "circle", "parallelogram", "rounded_rect"] as const;
                    const currentIndex = order.indexOf(activeShapeVariant);
                    setActiveShapeVariant(order[(currentIndex + 1) % order.length]);
                  }
                  setActiveTool(tool);
                }}
                title={`${tool} (${shortcut})`}
              >
                {shortcut}
              </button>
            ))}
            {!publicToken ? (
              <button
                type="button"
                className="mt-auto flex h-9 w-9 items-center justify-center rounded-xl border border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border-secondary)]"
                onClick={() => setDiagramSelectorOpen(true)}
                title="Load starter template"
              >
                +
              </button>
            ) : null}
          </div>
          <div
            ref={canvasRef}
            className="relative min-h-0 flex-1 overflow-hidden"
            style={{
              width: panelOpen ? "calc(100vw - 48px - 280px)" : "calc(100vw - 48px)",
            }}
          >
            <FlowchartCanvas
              flowchartId={flowchart.id}
              canEdit={canEdit}
              currentUserName="You"
              currentUserColor={avatarColor}
              onReady={(instance) => {
                reactFlowRef.current = instance;
              }}
              onCreateComment={async ({ content, x, y }) => {
                if (publicToken) {
                  return;
                }

                await addComment.mutateAsync({ content, x, y });
              }}
            />
            {!publicToken && showComments
              ? flattenComments(commentsQuery.data ?? []).map((comment) => (
                  <CommentPin key={comment.id} comment={comment} viewport={viewport} />
                ))
              : null}
            <RemoteCursors cursors={remoteUsers} viewport={viewport} />
          </div>
          {panelOpen ? (
            <aside className="w-[280px] border-l border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {showVersions ? "Versions" : selectedEdge ? "Edge" : selectedNode ? "Node" : "Inspector"}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (showVersions) {
                      toggleVersions();
                    } else {
                      useFlowchartStore.getState().setSelection([], []);
                    }
                  }}
                >
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              {showVersions ? (
                <VersionHistoryPanel
                  versions={versionsQuery.data ?? []}
                  onRestore={(versionId) => {
                    void restoreVersion.mutateAsync(versionId).then(() => {
                      toast.success("Version restored");
                    });
                  }}
                />
              ) : selectedNode ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                      Appearance
                    </div>
                    {"fill" in selectedNode.data ? (
                      <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                        <span>Fill</span>
                        <Input
                          value={selectedNode.data.fill}
                          onChange={(event) => updateNode(selectedNode.id, { fill: event.target.value })}
                        />
                      </label>
                    ) : null}
                    {"stroke" in selectedNode.data ? (
                      <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                        <span>Stroke</span>
                        <Input
                          value={selectedNode.data.stroke}
                          onChange={(event) => updateNode(selectedNode.id, { stroke: event.target.value })}
                        />
                      </label>
                    ) : null}
                    {"strokeWidth" in selectedNode.data ? (
                      <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                        <span>Stroke Width</span>
                        <Input
                          type="number"
                          value={selectedNode.data.strokeWidth}
                          onChange={(event) => updateNode(selectedNode.id, { strokeWidth: Number(event.target.value) })}
                        />
                      </label>
                    ) : null}
                  </div>
                  {"fontSize" in selectedNode.data ? (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                        Text
                      </div>
                      <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                        <span>Font Size</span>
                        <Input
                          type="number"
                          value={selectedNode.data.fontSize}
                          onChange={(event) => updateNode(selectedNode.id, { fontSize: Number(event.target.value) })}
                        />
                      </label>
                    </div>
                  ) : null}
                  {selectedNode.data.type === "group" ? (
                    <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                      <span>Opacity</span>
                      <Input
                        type="number"
                        min={0}
                        max={0.3}
                        step={0.01}
                        value={selectedNode.data.fillOpacity}
                        onChange={(event) => updateNode(selectedNode.id, { fillOpacity: Number(event.target.value) })}
                      />
                    </label>
                  ) : null}
                  {selectedNode.data.type === "task_card" ? (
                    <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                      <span>Linked Task ID</span>
                      <Input
                        value={selectedNode.data.taskId}
                        onChange={(event) => updateNode(selectedNode.id, { taskId: event.target.value })}
                      />
                    </label>
                  ) : null}
                  {selectedNode.data.type === "idea_card" ? (
                    <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                      <span>Linked Idea ID</span>
                      <Input
                        value={selectedNode.data.ideaId}
                        onChange={(event) => updateNode(selectedNode.id, { ideaId: event.target.value })}
                      />
                    </label>
                  ) : null}
                  {selectedNode.data.type === "image" && selectedNode.data.storageKey ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        deleteNode(selectedNode.id);
                      }}
                    >
                      Remove Image Node
                    </Button>
                  ) : null}
                </div>
              ) : selectedEdge ? (
                <div className="space-y-4">
                  <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span>Label</span>
                    <Input
                      value={selectedEdge.data?.label ?? ""}
                      onChange={(event) => updateEdge(selectedEdge.id, { label: event.target.value })}
                    />
                  </label>
                  <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span>Color</span>
                    <Input
                      value={selectedEdge.data?.color ?? ""}
                      onChange={(event) => updateEdge(selectedEdge.id, { color: event.target.value })}
                    />
                  </label>
                  <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span>Style</span>
                    <select
                      className="flex h-9 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-sm text-[var(--color-text-primary)]"
                      value={selectedEdge.data?.style ?? "curved"}
                      onChange={(event) =>
                        updateEdge(selectedEdge.id, {
                          style: event.target.value as NonNullable<OrbitEdge["data"]>["style"],
                        })
                      }
                    >
                      <option value="straight">Straight</option>
                      <option value="curved">Curved</option>
                      <option value="orthogonal">Orthogonal</option>
                    </select>
                  </label>
                  <label className="block space-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span>Line Style</span>
                    <select
                      className="flex h-9 w-full rounded-md border border-[var(--color-border-secondary)] bg-[var(--color-surface-strong)] px-3 py-1 text-sm text-[var(--color-text-primary)]"
                      value={selectedEdge.data?.lineStyle ?? "solid"}
                      onChange={(event) =>
                        updateEdge(selectedEdge.id, {
                          lineStyle: event.target.value as NonNullable<OrbitEdge["data"]>["lineStyle"],
                        })
                      }
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                    </select>
                  </label>
                </div>
              ) : (
                <div className="text-sm text-[var(--color-text-secondary)]">Select a node or edge to edit it.</div>
              )}
            </aside>
          ) : (
            <button
              type="button"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--color-border-secondary)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-xl"
              onClick={() => toggleVersions()}
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {!publicToken ? (
        <>
          <ShareModal
            open={shareOpen}
            shareUrl={share.shareUrl}
            isPublic={flowchart.isPublic}
            onClose={() => setShareOpen(false)}
            onToggle={(enabled) => {
              void share.mutateAsync(enabled).then((result) => {
                setShareOpen(true);
                toast.success(result.shareUrl ? "Share link updated" : "Sharing disabled");
              });
            }}
          />
          <DiagramTypeSelector
            open={diagramSelectorOpen}
            onSelect={(diagramType) => {
              setDiagramSelectorOpen(false);
              const canvasState = buildTemplateCanvas(diagramType);
              useFlowchartStore.getState().loadCanvas(canvasState, mode);
              toast.success(`${diagramType ?? "Blank"} template loaded`);
            }}
          />
        </>
      ) : null}
    </>
  );
}
