"use client";

import "@xyflow/react/dist/style.css";

import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { CommentDialog } from "@/components/flowchart/CommentDialog";
import { EDGE_TYPES, NODE_TYPES } from "@/components/flowchart/registry";
import { useFlowchartKeyboard } from "@/hooks/useFlowchartKeyboard";
import { useFlowchartRealtime } from "@/hooks/useFlowchartRealtime";
import { DEFAULT_EDGE_DATA } from "@/lib/flowchart/constants";
import { autoRouteForMovedNode } from "@/lib/flowchart/autoRoute";
import { createNodeForTool } from "@/lib/flowchart/nodeFactory";
import { fetchApiJson } from "@/lib/api/client";
import { useSessionContext } from "@/components/providers/SessionProvider";
import { useUploadFlowchartImage } from "@/hooks/useFlowchart";
import { useFlowchartStore, getFlowchartCanvasSnapshot } from "@/stores/flowchartStore";
import type { OrbitEdge, OrbitNode } from "@/types/flowchart";

type FlowchartCanvasProps = {
  flowchartId: string;
  canEdit: boolean;
  currentUserName: string;
  currentUserColor: string;
  onReady: (instance: ReactFlowInstance<OrbitNode, OrbitEdge>) => void;
  onCreateComment: (payload: { content: string; x: number; y: number }) => Promise<void> | void;
};

function compressImageFile(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const longestSide = Math.max(image.width, image.height);
      const scale = longestSide > 1024 ? 1024 / longestSide : 1;

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Failed to compress image"));
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Failed to compress image"));
            return;
          }

          resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        0.85,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image"));
    };

    image.src = objectUrl;
  });
}

function mapTaskPriority(priority: unknown): "critical" | "high" | "medium" | "low" | null {
  // Assumption: the existing task API uses numeric priorities 1..3, so we map them into the richer canvas scale.
  if (priority === 3) {
    return "critical";
  }

  if (priority === 2) {
    return "high";
  }

  if (priority === 1) {
    return "medium";
  }

  return null;
}

function CanvasSurface({
  flowchartId,
  canEdit,
  currentUserName,
  currentUserColor,
  onReady,
  onCreateComment,
}: FlowchartCanvasProps) {
  const router = useRouter();
  const { userId, workspaceId, authToken } = useSessionContext();
  const reactFlow = useReactFlow<OrbitNode, OrbitEdge>();
  const [pendingCommentPosition, setPendingCommentPosition] = useState<{ x: number; y: number } | null>(null);
  const nodes = useFlowchartStore((state) => state.nodes);
  const edges = useFlowchartStore((state) => state.edges);
  const mode = useFlowchartStore((state) => state.mode);
  const activeTool = useFlowchartStore((state) => state.activeTool);
  const activeShapeVariant = useFlowchartStore((state) => state.activeShapeVariant);
  const snapToGrid = useFlowchartStore((state) => state.snapToGrid);
  const gridSize = useFlowchartStore((state) => state.gridSize);
  const showMinimap = useFlowchartStore((state) => state.showMinimap);
  const showGrid = useFlowchartStore((state) => state.showGrid);
  const setNodes = useFlowchartStore((state) => state.setNodes);
  const setEdges = useFlowchartStore((state) => state.setEdges);
  const setViewport = useFlowchartStore((state) => state.setViewport);
  const addNode = useFlowchartStore((state) => state.addNode);
  const addEdge = useFlowchartStore((state) => state.addEdge);
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const setSelection = useFlowchartStore((state) => state.setSelection);
  const pushHistory = useFlowchartStore((state) => state.pushHistory);
  const uploadImage = useUploadFlowchartImage(flowchartId);
  const pendingImagePosition = useRef<{ x: number; y: number } | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const autoRouteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { broadcastCanvasOp } = useFlowchartRealtime({
    flowchartId,
    userId,
    userName: currentUserName,
    avatarColor: currentUserColor,
    reactFlow,
  });

  useFlowchartKeyboard({
    reactFlow,
    canEdit,
    onOpenLinkPanel: () => {
      window.dispatchEvent(new CustomEvent("orbit:open-link-panel"));
    },
  });

  useEffect(() => {
    onReady(reactFlow);
  }, [onReady, reactFlow]);

  useEffect(() => {
    const onOpenTask = (event: Event) => {
      const detail = (event as CustomEvent<{ taskId: string }>).detail;
      if (detail?.taskId) {
        router.push(`/tasks?taskId=${detail.taskId}`);
      }
    };

    const onOpenIdea = (event: Event) => {
      const detail = (event as CustomEvent<{ ideaId: string }>).detail;
      if (detail?.ideaId) {
        router.push(`/ideas?ideaId=${detail.ideaId}`);
      }
    };

    const onRefreshTask = (event: Event) => {
      const detail = (event as CustomEvent<{ taskId: string }>).detail;
      if (!detail?.taskId || !workspaceId) {
        return;
      }

      void fetchApiJson<unknown>(`/api/tasks/${detail.taskId}`, {
        session: {
          workspaceId,
          authToken,
        },
      })
        .then((response) => {
          const task = response as {
            data?: {
              id: string;
              title?: string;
              status?: string;
              priority?: number;
              dueDate?: string | null;
              assignee?: { id?: string | null; fullName?: string | null; avatarUrl?: string | null };
              assigneeId?: string | null;
              metadata?: { completionPct?: number };
            };
          };

          const taskPayload = task.data;
          if (!taskPayload) {
            return;
          }

          const targetNode = useFlowchartStore.getState().nodes.find(
            (node) => node.data.type === "task_card" && node.data.taskId === detail.taskId,
          );

          if (!targetNode) {
            return;
          }

          if (targetNode.data.type !== "task_card") {
            return;
          }

          updateNode(targetNode.id, {
            taskTitle: taskPayload.title ?? targetNode.data.taskTitle,
            taskStatus: taskPayload.status ?? targetNode.data.taskStatus,
            taskPriority: mapTaskPriority(taskPayload.priority),
            assigneeId: taskPayload.assignee?.id ?? taskPayload.assigneeId ?? null,
            assigneeName: taskPayload.assignee?.fullName ?? null,
            assigneeAvatar: taskPayload.assignee?.avatarUrl ?? null,
            dueDate: taskPayload.dueDate ?? null,
            completionPct:
              typeof taskPayload.metadata?.completionPct === "number"
                ? taskPayload.metadata.completionPct
                : taskPayload.status === "done"
                  ? 100
                  : taskPayload.status === "in_progress"
                    ? 50
                    : 0,
          });
        })
        .catch((error) => {
          console.error("Task refresh failed", error);
          toast.error("Failed to refresh task card");
        });
    };

    const onVoteIdea = (event: Event) => {
      const detail = (event as CustomEvent<{ ideaId: string }>).detail;
      if (!detail?.ideaId || !workspaceId) {
        return;
      }

      void fetchApiJson<unknown>(`/api/ideas/${detail.ideaId}/vote`, {
        method: "POST",
        session: {
          workspaceId,
          authToken,
        },
      })
        .then((response) => {
          const result = response as { voteCount?: number };
          const targetNode = useFlowchartStore.getState().nodes.find(
            (node) => node.data.type === "idea_card" && node.data.ideaId === detail.ideaId,
          );

          if (targetNode && typeof result.voteCount === "number") {
            updateNode(targetNode.id, {
              voteCount: result.voteCount,
            });
          }
        })
        .catch((error) => {
          console.error("Idea vote failed", error);
          toast.error("Failed to vote on idea");
        });
    };

    window.addEventListener("orbit:open-task", onOpenTask);
    window.addEventListener("orbit:open-idea", onOpenIdea);
    window.addEventListener("orbit:refresh-task-node", onRefreshTask);
    window.addEventListener("orbit:vote-idea-node", onVoteIdea);

    return () => {
      window.removeEventListener("orbit:open-task", onOpenTask);
      window.removeEventListener("orbit:open-idea", onOpenIdea);
      window.removeEventListener("orbit:refresh-task-node", onRefreshTask);
      window.removeEventListener("orbit:vote-idea-node", onVoteIdea);
    };
  }, [authToken, router, updateNode, workspaceId]);

  const handleNodesChange = (changes: NodeChange<OrbitNode>[]) => {
    const nextNodes = applyNodeChanges(changes, nodes);
    const hasStructuralChange = changes.some((change) => change.type !== "select");

    if (hasStructuralChange) {
      setNodes(nextNodes);
    } else {
      useFlowchartStore.setState({ nodes: nextNodes });
    }

    changes.forEach((change) => {
      if (change.type === "remove") {
        broadcastCanvasOp({
          type: "NODE_DELETE",
          payload: { id: change.id },
        });
      }
    });
  };

  const handleEdgesChange = (changes: EdgeChange<OrbitEdge>[]) => {
    const nextEdges = applyEdgeChanges(changes, edges);
    const hasStructuralChange = changes.some((change) => change.type !== "select");

    if (hasStructuralChange) {
      setEdges(nextEdges);
    } else {
      useFlowchartStore.setState({ edges: nextEdges });
    }

    changes.forEach((change) => {
      if (change.type === "remove") {
        broadcastCanvasOp({
          type: "EDGE_DELETE",
          payload: { id: change.id },
        });
      }
    });
  };

  const handleConnect = (connection: Connection) => {
    if (!canEdit) {
      return;
    }

    if (!connection.source || !connection.target) {
      return;
    }

    const edge: OrbitEdge = {
      ...connection,
      id: crypto.randomUUID(),
      source: connection.source,
      target: connection.target,
      type: "orbit",
      data: { ...DEFAULT_EDGE_DATA },
    };

    addEdge(edge);
    pushHistory(getFlowchartCanvasSnapshot());
    broadcastCanvasOp({
      type: "EDGE_ADD",
      payload: edge,
    });
  };

  const handlePaneClick = async (event: React.MouseEvent) => {
    const position = reactFlow.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    if (activeTool === "comment") {
      setPendingCommentPosition(position);
      return;
    }

    if (!canEdit) {
      setSelection([], []);
      return;
    }

    if (activeTool === "image") {
      pendingImagePosition.current = position;
      imageInputRef.current?.click();
      return;
    }

    if (
      activeTool === "shape" ||
      activeTool === "text" ||
      activeTool === "sticky" ||
      activeTool === "task_card" ||
      activeTool === "idea_card" ||
      activeTool === "group" ||
      activeTool === "code"
    ) {
      const node = createNodeForTool(activeTool, position, {
        activeShapeVariant,
        authorId: userId,
        authorName: currentUserName,
      });
      addNode(node);
      pushHistory(getFlowchartCanvasSnapshot());
      broadcastCanvasOp({
        type: "NODE_ADD",
        payload: node,
      });
      return;
    }

    setSelection([], []);
  };

  const handleSelectionChange = (params: OnSelectionChangeParams<OrbitNode, OrbitEdge>) => {
    setSelection(
      params.nodes.map((node) => node.id),
      params.edges.map((edge) => edge.id),
    );
  };

  return (
    <div className="relative h-full w-full">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          const position = pendingImagePosition.current;
          event.currentTarget.value = "";

          if (!file || !position) {
            return;
          }

          void compressImageFile(file)
            .then((compressedFile) => uploadImage.mutateAsync(compressedFile))
            .then(({ url, storageKey }) => {
              const node = createNodeForTool("image", position, {
                activeShapeVariant,
                authorId: userId,
                authorName: currentUserName,
              });

              if (node.data.type === "image") {
                node.data.url = url;
                node.data.storageKey = storageKey;
                node.data.caption = file.name;
              }

              addNode(node);
              pushHistory(getFlowchartCanvasSnapshot());
              broadcastCanvasOp({
                type: "NODE_ADD",
                payload: node,
              });
            })
            .catch((error) => {
              console.error("Image upload failed", error);
              toast.error("Failed to upload image");
            })
            .finally(() => {
              pendingImagePosition.current = null;
            });
        }}
      />
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onPaneClick={(event) => {
          void handlePaneClick(event);
        }}
        onSelectionChange={handleSelectionChange}
        onNodeDragStop={(_event, node) => {
          broadcastCanvasOp({
            type: "NODE_MOVE",
            payload: {
              id: node.id,
              position: node.position,
            },
          });

          if (autoRouteTimerRef.current) {
            clearTimeout(autoRouteTimerRef.current);
          }

          autoRouteTimerRef.current = setTimeout(() => {
            const nextEdges = autoRouteForMovedNode(node.id, useFlowchartStore.getState().nodes, useFlowchartStore.getState().edges);
            setEdges(nextEdges);
          }, 80);

          pushHistory(getFlowchartCanvasSnapshot());
        }}
        onMove={(_event, viewport) => {
          setViewport(viewport);
          broadcastCanvasOp({
            type: "VIEWPORT_CHANGE",
            payload: viewport,
          });
        }}
        connectionMode={ConnectionMode.Loose}
        defaultEdgeOptions={{ type: "orbit", data: DEFAULT_EDGE_DATA }}
        snapToGrid={snapToGrid}
        snapGrid={[gridSize, gridSize]}
        minZoom={0.1}
        maxZoom={4}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        panOnDrag={[1, 2]}
        selectionOnDrag
        panOnScroll={mode === "infinite"}
        nodesDraggable={canEdit}
        nodesConnectable={canEdit}
        elementsSelectable={canEdit}
        className="bg-[var(--color-background)]"
      >
        {showGrid ? (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="var(--color-border-tertiary)"
          />
        ) : null}
        {mode === "infinite" && showMinimap ? <MiniMap pannable zoomable /> : null}
        <Controls />
      </ReactFlow>
      {pendingCommentPosition ? (
        <CommentDialog
          onClose={() => setPendingCommentPosition(null)}
          onSubmit={(content) => onCreateComment({ content, ...pendingCommentPosition })}
        />
      ) : null}
    </div>
  );
}

export default function FlowchartCanvas(props: FlowchartCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasSurface {...props} />
    </ReactFlowProvider>
  );
}
