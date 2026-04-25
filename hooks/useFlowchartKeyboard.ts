"use client";

import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect } from "react";

import { DEFAULT_EDGE_DATA, DEFAULT_GROUP_DATA, DEFAULT_NODE_SIZE } from "@/lib/flowchart/constants";
import { getFlowchartCanvasSnapshot, useFlowchartStore } from "@/stores/flowchartStore";
import type { OrbitEdge, OrbitNode } from "@/types/flowchart";

const CLIPBOARD_KEY = "orbit-flowchart-clipboard";

type KeyboardOptions = {
  reactFlow: ReactFlowInstance<OrbitNode, OrbitEdge> | null;
  canEdit: boolean;
  onOpenLinkPanel?: () => void;
  onEscape?: () => void;
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable ||
    target.closest("[contenteditable='true']") !== null
  );
}

export function useFlowchartKeyboard({ reactFlow, canEdit, onOpenLinkPanel, onEscape }: KeyboardOptions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const store = useFlowchartStore.getState();
      const isMeta = event.metaKey || event.ctrlKey;

      if (!isMeta) {
        if (event.key.toLowerCase() === "v") {
          store.setActiveTool("select");
          return;
        }

        if (event.key.toLowerCase() === "h") {
          store.setActiveTool("hand");
          return;
        }

        if (event.key.toLowerCase() === "s") {
          store.setActiveTool("shape");
          return;
        }

        if (event.key.toLowerCase() === "t") {
          store.setActiveTool("text");
          return;
        }

        if (event.key.toLowerCase() === "k") {
          store.setActiveTool("sticky");
          return;
        }

        if (event.key.toLowerCase() === "i") {
          store.setActiveTool("image");
          return;
        }

        if (event.key.toLowerCase() === "c") {
          store.setActiveTool("connector");
          return;
        }

        if (event.key.toLowerCase() === "m") {
          store.setActiveTool("comment");
          return;
        }

        if (event.key.toLowerCase() === "g") {
          store.setActiveTool("group");
          return;
        }
      }

      if ((event.key === "Delete" || event.key === "Backspace") && canEdit) {
        event.preventDefault();
        store.selectedNodeIds.forEach((id) => store.deleteNode(id));
        store.selectedEdgeIds.forEach((id) => store.deleteEdge(id));
        store.pushHistory(getFlowchartCanvasSnapshot());
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        store.setSelection([], []);
        store.setActiveTool("select");
        onEscape?.();
        return;
      }

      if (!isMeta) {
        return;
      }

      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        store.undo();
        return;
      }

      if (event.key.toLowerCase() === "z" && event.shiftKey) {
        event.preventDefault();
        store.redo();
        return;
      }

      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        store.setSelection(
          store.nodes.map((node) => node.id),
          store.edges.map((edge) => edge.id),
        );
        return;
      }

      if (event.key.toLowerCase() === "h" && event.shiftKey) {
        event.preventDefault();
        void reactFlow?.fitView({ padding: 0.1 });
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void reactFlow?.zoomIn();
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        void reactFlow?.zoomOut();
        return;
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenLinkPanel?.();
        return;
      }

      if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        const selectedNodes = store.nodes.filter((node) => store.selectedNodeIds.includes(node.id));
        const selectedNodeIdSet = new Set(selectedNodes.map((node) => node.id));
        const selectedEdges = store.edges.filter(
          (edge) => selectedNodeIdSet.has(edge.source) && selectedNodeIdSet.has(edge.target),
        );

        window.localStorage.setItem(
          CLIPBOARD_KEY,
          JSON.stringify({
            nodes: selectedNodes,
            edges: selectedEdges,
          }),
        );
        return;
      }

      if (event.key.toLowerCase() === "v" && canEdit) {
        event.preventDefault();
        const raw = window.localStorage.getItem(CLIPBOARD_KEY);
        if (!raw) {
          return;
        }

        const parsed = JSON.parse(raw) as { nodes: OrbitNode[]; edges: OrbitEdge[] };
        const nodeIdMap = new Map<string, string>();
        const duplicatedNodes = parsed.nodes.map((node) => {
          const id = crypto.randomUUID();
          nodeIdMap.set(node.id, id);
          return {
            ...node,
            id,
            position: {
              x: node.position.x + 20,
              y: node.position.y + 20,
            },
            selected: false,
          };
        });
        const duplicatedEdges = parsed.edges
          .filter((edge) => nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target))
          .map((edge) => ({
            ...edge,
            id: crypto.randomUUID(),
            source: nodeIdMap.get(edge.source) ?? edge.source,
            target: nodeIdMap.get(edge.target) ?? edge.target,
            data: edge.data ?? { ...DEFAULT_EDGE_DATA },
          }));

        store.setNodes([...store.nodes, ...duplicatedNodes]);
        store.setEdges([...store.edges, ...duplicatedEdges]);
        store.setSelection(
          duplicatedNodes.map((node) => node.id),
          duplicatedEdges.map((edge) => edge.id),
        );
        store.pushHistory(getFlowchartCanvasSnapshot());
        return;
      }

      if (event.key.toLowerCase() === "d" && canEdit) {
        event.preventDefault();
        const selectedNodes = store.nodes.filter((node) => store.selectedNodeIds.includes(node.id));
        const selectedNodeIdSet = new Set(selectedNodes.map((node) => node.id));
        const relatedEdges = store.edges.filter(
          (edge) => selectedNodeIdSet.has(edge.source) && selectedNodeIdSet.has(edge.target),
        );
        window.localStorage.setItem(
          CLIPBOARD_KEY,
          JSON.stringify({
            nodes: selectedNodes,
            edges: relatedEdges,
          }),
        );
        const pasteEvent = new KeyboardEvent("keydown", { key: "v", ctrlKey: true });
        window.dispatchEvent(pasteEvent);
        return;
      }

      if (event.key.toLowerCase() === "g" && canEdit && store.selectedNodeIds.length > 0) {
        event.preventDefault();
        const selectedNodes = store.nodes.filter((node) => store.selectedNodeIds.includes(node.id));
        const minX = Math.min(...selectedNodes.map((node) => node.position.x));
        const minY = Math.min(...selectedNodes.map((node) => node.position.y));
        const maxX = Math.max(...selectedNodes.map((node) => node.position.x + (node.width ?? DEFAULT_NODE_SIZE.shape.width)));
        const maxY = Math.max(...selectedNodes.map((node) => node.position.y + (node.height ?? DEFAULT_NODE_SIZE.shape.height)));

        store.addNode({
          id: crypto.randomUUID(),
          type: "group",
          position: {
            x: minX - 24,
            y: minY - 24,
          },
          width: maxX - minX + 48,
          height: maxY - minY + 48,
          data: {
            ...DEFAULT_GROUP_DATA,
            label: "Grouped items",
          },
        });
        store.pushHistory(getFlowchartCanvasSnapshot());
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [canEdit, onEscape, onOpenLinkPanel, reactFlow]);
}
