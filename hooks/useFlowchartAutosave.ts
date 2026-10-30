"use client";

import { useEffect, useRef } from "react";

import { useFlowchartStore } from "@/stores/flowchartStore";
import { useSaveCanvas } from "@/hooks/useFlowchart";
import type { CanvasState } from "@/types/flowchart";

type AutosaveProps = {
  flowchartId: string | null;
};

export function useFlowchartAutosave(flowchartId: string | null) {
  const isDirty = useFlowchartStore((state) => state.isDirty);
  const isSaving = useFlowchartStore((state) => state.isSaving);
  const getCanvasSnapshot = () => {
    const state = useFlowchartStore.getState();
    return {
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
    } as CanvasState;
  };
  const loadCanvas = useFlowchartStore((state) => state.loadCanvas);
  const markSaved = useFlowchartStore((state) => state.markSaved);
  const setIsSaving = useFlowchartStore((state) => state.setIsSaving);

  const saveCanvas = useSaveCanvas(flowchartId ?? "");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedStateRef = useRef<string>("");

  // Debounced autosave: 2000ms after last change
  useEffect(() => {
    if (!flowchartId || !isDirty) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      const canvasState = getCanvasSnapshot();
      const stateString = JSON.stringify(canvasState);

      // Skip if nothing changed
      if (stateString === lastSavedStateRef.current) {
        useFlowchartStore.getState().setIsDirty(false);
        return;
      }

      setIsSaving(true);
      saveCanvas.mutate(canvasState, {
        onSuccess: () => {
          lastSavedStateRef.current = stateString;
          markSaved();
        },
        onSettled: () => {
          setIsSaving(false);
        },
      });
    }, 2000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isDirty, flowchartId, getCanvasSnapshot, saveCanvas, markSaved, setIsSaving]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      // Flush any pending changes
      if (isDirty && flowchartId) {
        const canvasState = getCanvasSnapshot();
        saveCanvas.mutate(canvasState);
      }
    };
  }, []);

  const statusLabel = (() => {
    if (isSaving) return "Saving...";
    if (!isDirty) {
      const lastSaved = useFlowchartStore.getState().lastSavedAt;
      if (lastSaved) {
        const seconds = Math.round((Date.now() - lastSaved.getTime()) / 1000);
        if (seconds < 60) return `Saved ${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `Saved ${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        return `Saved ${hours}h ago`;
      }
      return "All changes saved";
    }
    return "Unsaved changes";
  })();

  return { statusLabel };
}