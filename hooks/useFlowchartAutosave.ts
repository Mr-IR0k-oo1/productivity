"use client";

import { formatDistanceToNow } from "date-fns";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import { getFlowchartCanvasSnapshot, useFlowchartStore } from "@/stores/flowchartStore";
import { useSaveCanvas } from "@/hooks/useFlowchart";

const AUTOSAVE_DELAY_MS = 2000;

export function useFlowchartAutosave(flowchartId: string | null) {
  const isDirty = useFlowchartStore((state) => state.isDirty);
  const isSaving = useFlowchartStore((state) => state.isSaving);
  const lastSavedAt = useFlowchartStore((state) => state.lastSavedAt);
  const setIsSaving = useFlowchartStore((state) => state.setIsSaving);
  const markSaved = useFlowchartStore((state) => state.markSaved);
  const saveCanvas = useSaveCanvas(flowchartId ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!flowchartId || !isDirty) {
      return;
    }

    timerRef.current = setTimeout(() => {
      const snapshot = getFlowchartCanvasSnapshot();
      setIsSaving(true);

      void saveCanvas
        .mutateAsync(snapshot)
        .then(() => {
          markSaved();
        })
        .catch((error) => {
          console.error("Flowchart autosave failed", error);
          setIsSaving(false);
          toast.error("Failed to save flowchart");
        });
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (!timerRef.current) {
        return;
      }

      clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [flowchartId, isDirty, markSaved, saveCanvas, setIsSaving]);

  useEffect(() => {
    return () => {
      if (!flowchartId || !useFlowchartStore.getState().isDirty) {
        return;
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const snapshot = getFlowchartCanvasSnapshot();
      setIsSaving(true);
      void saveCanvas
        .mutateAsync(snapshot)
        .then(() => {
          markSaved();
        })
        .catch((error) => {
          console.error("Flowchart autosave flush failed", error);
          setIsSaving(false);
        });
    };
  }, [flowchartId, markSaved, saveCanvas, setIsSaving]);

  const statusLabel = useMemo(() => {
    if (isSaving) {
      return "Saving...";
    }

    if (lastSavedAt) {
      return `Saved ${formatDistanceToNow(lastSavedAt, { addSuffix: true })}`;
    }

    return "Idle";
  }, [isSaving, lastSavedAt]);

  return {
    isSaving,
    lastSavedAt,
    statusLabel,
  };
}
