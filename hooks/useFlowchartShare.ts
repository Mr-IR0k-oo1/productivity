"use client";

import { useMemo } from "react";

import { useShareFlowchart as useShareFlowchartMutation } from "@/hooks/useFlowchart";

export function buildFlowchartShareUrl(publicToken: string | null) {
  if (!publicToken) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") ?? "";
  return `${baseUrl}/f/${publicToken}`;
}

export function useShareFlowchart(flowchartId: string, publicToken: string | null) {
  const mutation = useShareFlowchartMutation(flowchartId);
  const shareUrl = useMemo(() => buildFlowchartShareUrl(publicToken), [publicToken]);

  return {
    ...mutation,
    shareUrl,
  };
}
