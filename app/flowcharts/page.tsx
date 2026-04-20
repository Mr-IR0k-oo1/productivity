import { Suspense } from "react";
import { FlowchartWorkspace } from "@/components/features/flowchart/FlowchartWorkspace";

function FlowchartsLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-32 rounded bg-zinc-800" />
        <div className="h-96 w-[800px] rounded bg-zinc-800" />
      </div>
    </div>
  );
}

export default function FlowchartsPage() {
  return (
    <Suspense fallback={<FlowchartsLoading />}>
      <FlowchartWorkspace />
    </Suspense>
  );
}