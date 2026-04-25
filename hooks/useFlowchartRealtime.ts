"use client";

import type { ReactFlowInstance } from "@xyflow/react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { supabaseClient } from "@/lib/supabase/client";
import { useFlowchartStore } from "@/stores/flowchartStore";
import type { CanvasOp, CursorPosition, OrbitEdge, OrbitNode } from "@/types/flowchart";

const CURSOR_THROTTLE_MS = 60;

type RealtimeOptions = {
  flowchartId: string | null;
  userId: string | null;
  userName: string;
  avatarColor: string;
  reactFlow: ReactFlowInstance<OrbitNode, OrbitEdge> | null;
};

export function useFlowchartRealtime({
  flowchartId,
  userId,
  userName,
  avatarColor,
  reactFlow,
}: RealtimeOptions) {
  const addNode = useFlowchartStore((state) => state.addNode);
  const updateNode = useFlowchartStore((state) => state.updateNode);
  const deleteNode = useFlowchartStore((state) => state.deleteNode);
  const addEdge = useFlowchartStore((state) => state.addEdge);
  const updateEdge = useFlowchartStore((state) => state.updateEdge);
  const deleteEdge = useFlowchartStore((state) => state.deleteEdge);
  const setViewport = useFlowchartStore((state) => state.setViewport);
  const setRemoteCursor = useFlowchartStore((state) => state.setRemoteCursor);
  const removeRemoteCursor = useFlowchartStore((state) => state.removeRemoteCursor);
  const nodeMoveTsRef = useRef(new Map<string, number>());
  const cursorThrottleRef = useRef<number>(0);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabaseClient>["channel"]> | null>(null);

  const channelName = useMemo(() => (flowchartId ? `flowchart:${flowchartId}` : null), [flowchartId]);

  useEffect(() => {
    if (!channelName || !supabaseClient || !userId) {
      return;
    }

    const channel = supabaseClient.channel(channelName, {
      config: {
        broadcast: {
          self: false,
        },
      },
    });
    channelRef.current = channel;

    channel.on("broadcast", { event: "CANVAS_OP" }, ({ payload }) => {
      const op = payload as CanvasOp;

      if (!op || op.userId === userId) {
        return;
      }

      if (op.type === "NODE_MOVE") {
        const movePayload = op.payload as { id: string; position: { x: number; y: number } };
        const lastTs = nodeMoveTsRef.current.get(movePayload.id) ?? 0;

        if (op.ts > lastTs) {
          nodeMoveTsRef.current.set(movePayload.id, op.ts);
          const target = useFlowchartStore.getState().nodes.find((node) => node.id === movePayload.id);
          if (target) {
            useFlowchartStore.setState((state) => ({
              ...state,
              nodes: state.nodes.map((node) =>
                node.id === movePayload.id
                  ? {
                      ...node,
                      position: movePayload.position,
                    }
                  : node,
              ),
            }));
          }
        }

        return;
      }

      if (op.type === "NODE_ADD") {
        const node = op.payload as OrbitNode;
        const exists = useFlowchartStore.getState().nodes.some((item) => item.id === node.id);
        if (!exists) {
          addNode(node);
        }
        return;
      }

      if (op.type === "NODE_UPDATE") {
        const payloadData = op.payload as { id: string; data: Partial<OrbitNode["data"]> };
        updateNode(payloadData.id, payloadData.data);
        return;
      }

      if (op.type === "NODE_DELETE") {
        const payloadData = op.payload as { id: string };
        deleteNode(payloadData.id);
        return;
      }

      if (op.type === "EDGE_ADD") {
        const edge = op.payload as OrbitEdge;
        const exists = useFlowchartStore.getState().edges.some((item) => item.id === edge.id);
        if (!exists) {
          addEdge(edge);
        }
        return;
      }

      if (op.type === "EDGE_UPDATE") {
        const payloadData = op.payload as { id: string; data: Partial<OrbitEdge["data"]> };
        updateEdge(payloadData.id, payloadData.data ?? {});
        return;
      }

      if (op.type === "EDGE_DELETE") {
        const payloadData = op.payload as { id: string };
        deleteEdge(payloadData.id);
        return;
      }

      if (op.type === "VIEWPORT_CHANGE") {
        const payloadData = op.payload as { x: number; y: number; zoom: number };
        setViewport(payloadData);
      }
    });

    channel.on("broadcast", { event: "CURSOR_MOVE" }, ({ payload }) => {
      const cursor = payload as CursorPosition;
      if (!cursor || cursor.userId === userId) {
        return;
      }

      setRemoteCursor(cursor);
    });

    channel.on("broadcast", { event: "PRESENCE" }, ({ payload }) => {
      const presence = payload as Omit<CursorPosition, "x" | "y">;
      if (!presence || presence.userId === userId) {
        return;
      }

      setRemoteCursor({
        ...presence,
        x: 0,
        y: 0,
      });
    });

    channel.subscribe((status) => {
      if (status === "CHANNEL_ERROR") {
        toast.error("Connection lost - changes may not sync");
      }

      if (status === "SUBSCRIBED") {
        void channel.send({
          type: "broadcast",
          event: "PRESENCE",
          payload: {
            userId,
            userName,
            avatarColor,
          },
        });
      }
    });

    const onPointerMove = (event: PointerEvent) => {
      if (!reactFlow || !flowchartId) {
        return;
      }

      const now = Date.now();
      if (now - cursorThrottleRef.current < CURSOR_THROTTLE_MS) {
        return;
      }

      cursorThrottleRef.current = now;
      const position = reactFlow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      void channel.send({
        type: "broadcast",
        event: "CURSOR_MOVE",
        payload: {
          userId,
          userName,
          avatarColor,
          x: position.x,
          y: position.y,
        } satisfies CursorPosition,
      });
    };

    window.addEventListener("pointermove", onPointerMove);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      useFlowchartStore.getState().remoteUsers.forEach((_cursor, remoteUserId) => {
        removeRemoteCursor(remoteUserId);
      });
      channelRef.current = null;
      void channel.unsubscribe();
    };
  }, [
    addEdge,
    addNode,
    avatarColor,
    channelName,
    deleteEdge,
    deleteNode,
    flowchartId,
    reactFlow,
    removeRemoteCursor,
    setRemoteCursor,
    setViewport,
    updateEdge,
    updateNode,
    userId,
    userName,
  ]);

  const broadcastCanvasOp = (op: Omit<CanvasOp, "ts" | "userId">) => {
    if (!channelName || !supabaseClient || !userId) {
      return;
    }

    const fullOp: CanvasOp = {
      ...op,
      ts: Date.now(),
      userId,
    };

    if (fullOp.type === "NODE_MOVE") {
      const payload = fullOp.payload as { id: string };
      nodeMoveTsRef.current.set(payload.id, fullOp.ts);
    }

    void channelRef.current?.send({
      type: "broadcast",
      event: "CANVAS_OP",
      payload: fullOp,
    });
  };

  return {
    broadcastCanvasOp,
  };
}
