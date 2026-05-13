import type { OrbitEdge, OrbitNode } from "@/types/flowchart";

const CLEARANCE = 10;

type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

function nodeBounds(node: OrbitNode): Bounds {
  return {
    left: node.position.x,
    top: node.position.y,
    right: node.position.x + (node.width ?? 200),
    bottom: node.position.y + (node.height ?? 80),
  };
}

function intersectsHorizontalSegment(y: number, x1: number, x2: number, bounds: Bounds) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  return y >= bounds.top - CLEARANCE && y <= bounds.bottom + CLEARANCE && maxX >= bounds.left - CLEARANCE && minX <= bounds.right + CLEARANCE;
}

function intersectsVerticalSegment(x: number, y1: number, y2: number, bounds: Bounds) {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  return x >= bounds.left - CLEARANCE && x <= bounds.right + CLEARANCE && maxY >= bounds.top - CLEARANCE && minY <= bounds.bottom + CLEARANCE;
}

function routeEdge(edge: OrbitEdge, nodes: OrbitNode[]): OrbitEdge {
  if (!edge.data?.autoRouted) {
    return edge;
  }

  const source = nodes.find((node) => node.id === edge.source);
  const target = nodes.find((node) => node.id === edge.target);

  if (!source || !target) {
    return edge;
  }

  const sourceCenter = {
    x: source.position.x + (source.width ?? 200) / 2,
    y: source.position.y + (source.height ?? 80) / 2,
  };
  const targetCenter = {
    x: target.position.x + (target.width ?? 200) / 2,
    y: target.position.y + (target.height ?? 80) / 2,
  };

  const blockingNode = nodes.find((node) => {
    if (node.id === source.id || node.id === target.id) {
      return false;
    }

    const bounds = nodeBounds(node);
    return (
      intersectsHorizontalSegment(sourceCenter.y, sourceCenter.x, targetCenter.x, bounds) ||
      intersectsVerticalSegment(targetCenter.x, sourceCenter.y, targetCenter.y, bounds)
    );
  });

  if (!blockingNode) {
    return {
      ...edge,
      data: {
        ...edge.data,
        waypoints: [],
      },
    };
  }

  const bounds = nodeBounds(blockingNode);
  const detourY =
    Math.abs(sourceCenter.y - bounds.top) < Math.abs(sourceCenter.y - bounds.bottom)
      ? bounds.top - CLEARANCE
      : bounds.bottom + CLEARANCE;

  return {
    ...edge,
    data: {
      ...edge.data,
      waypoints: [
        { x: sourceCenter.x, y: detourY },
        { x: targetCenter.x, y: detourY },
      ],
    },
  };
}

export function autoRouteForMovedNode(movedNodeId: string, nodes: OrbitNode[], edges: OrbitEdge[]) {
  return edges.map((edge) => {
    if (edge.source !== movedNodeId && edge.target !== movedNodeId) {
      return edge;
    }

    return routeEdge(edge, nodes);
  });
}
