import type { Metadata } from "next";

import { FlowDetailPage } from "@/components/flow/FlowDetailPage";
import { buildFlowStepMetadata, getFlowStep } from "@/components/flow/flow-content";

const step = getFlowStep("time");

export const metadata: Metadata = buildFlowStepMetadata(step);

export default function FlowTimePage() {
  return <FlowDetailPage step={step} />;
}
