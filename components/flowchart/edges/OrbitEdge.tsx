"use client";

import type { EdgeProps } from "@xyflow/react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
} from "@xyflow/react";
import { Lock } from "lucide-react";
import React from "react";

import type { OrbitEdge } from "@/types/flowchart";

function markerId(edgeId: string, position: "start" | "end") {
  return `orbit-edge-${position}-${edgeId}`;
}

function buildWaypointPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  waypoints: Array<{ x: number; y: number }>,
) {
  const segments = [`M ${sourceX} ${sourceY}`];

  waypoints.forEach((waypoint) => {
    segments.push(`L ${waypoint.x} ${waypoint.y}`);
  });

  segments.push(`L ${targetX} ${targetY}`);
  return segments.join(" ");
}

function OrbitEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<OrbitEdge>) {
  const edgeData = data ?? {
    style: "curved",
    lineStyle: "solid",
    color: "var(--color-text-secondary)",
    strokeWidth: 1,
    label: "",
    arrowStart: "none",
    arrowEnd: "open",
    autoRouted: true,
    createsTaskDep: false,
  };

  const [defaultPath, labelX, labelY] =
    edgeData.style === "straight"
      ? getStraightPath({ sourceX, sourceY, targetX, targetY })
      : edgeData.style === "orthogonal"
        ? getSmoothStepPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
          })
        : getBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
          });

  const edgePath =
    edgeData.waypoints && edgeData.waypoints.length > 0
      ? buildWaypointPath(sourceX, sourceY, targetX, targetY, edgeData.waypoints)
      : defaultPath;

  const dashArray =
    edgeData.lineStyle === "dashed" ? "8 4" : edgeData.lineStyle === "dotted" ? "2 4" : undefined;

  return (
    <>
      <defs>
        {edgeData.arrowStart !== "none" ? (
          <marker
            id={markerId(id, "start")}
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto-start-reverse"
          >
            {edgeData.arrowStart === "filled" ? (
              <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeData.color} />
            ) : (
              <path d="M 10 0 L 0 5 L 10 10" fill="none" stroke={edgeData.color} strokeWidth="1.5" />
            )}
          </marker>
        ) : null}
        {edgeData.arrowEnd !== "none" ? (
          <marker
            id={markerId(id, "end")}
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="5"
            orient="auto"
          >
            {edgeData.arrowEnd === "filled" ? (
              <path d="M 0 0 L 10 5 L 0 10 z" fill={edgeData.color} />
            ) : (
              <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke={edgeData.color} strokeWidth="1.5" />
            )}
          </marker>
        ) : null}
      </defs>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={edgeData.arrowStart !== "none" ? `url(#${markerId(id, "start")})` : undefined}
        markerEnd={edgeData.arrowEnd !== "none" ? `url(#${markerId(id, "end")})` : undefined}
        style={{
          stroke: edgeData.color,
          strokeWidth: edgeData.strokeWidth,
          strokeDasharray: dashArray,
        }}
      />
      {edgeData.label ? (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="nodrag nopan absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] shadow"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            onClick={() => {
              window.dispatchEvent(new CustomEvent("orbit:select-edge-style", { detail: { edgeId: id } }));
            }}
          >
            {edgeData.label}
          </button>
        </EdgeLabelRenderer>
      ) : null}
      {edgeData.createsTaskDep ? (
        <EdgeLabelRenderer>
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-surface)] p-1 text-[var(--color-text-secondary)] shadow"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 22}px)`,
            }}
          >
            <Lock className="h-3.5 w-3.5" />
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export default OrbitEdgeComponent;
