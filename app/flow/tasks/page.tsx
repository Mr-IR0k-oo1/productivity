import type { Metadata } from "next";

import { FlowDetailPage } from "@/components/flow/FlowDetailPage";
import { buildFlowStepMetadata, getFlowStep } from "@/components/flow/flow-content";

const step = getFlowStep("tasks");

export const metadata: Metadata = buildFlowStepMetadata(step);

export default function FlowTasksPage() {
  return <FlowDetailPage step={step} />;
}
