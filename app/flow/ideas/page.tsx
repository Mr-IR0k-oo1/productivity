import type { Metadata } from "next";

import { FlowDetailPage } from "@/components/flow/FlowDetailPage";
import { buildFlowStepMetadata, getFlowStep } from "@/components/flow/flow-content";

const step = getFlowStep("ideas");

export const metadata: Metadata = buildFlowStepMetadata(step);

export default function FlowIdeasPage() {
  return <FlowDetailPage step={step} />;
}
