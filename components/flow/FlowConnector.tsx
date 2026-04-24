import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type FlowConnectorProps = {
  orientation?: "horizontal" | "vertical";
};

export function FlowConnector({ orientation = "horizontal" }: FlowConnectorProps) {
  const isHorizontal = orientation === "horizontal";

  return (
    <div className={cn("flex items-center justify-center text-sky-300/80", isHorizontal ? "px-1" : "py-2")}>
      <div
        className={cn(
          "relative flex items-center justify-center",
          isHorizontal ? "h-10 w-20" : "h-20 w-10 flex-col",
        )}
      >
        <span
          className={cn(
            "absolute rounded-full bg-sky-300/70",
            isHorizontal ? "left-1 top-1/2 h-2 w-2 -translate-y-1/2" : "top-1 left-1/2 h-2 w-2 -translate-x-1/2",
          )}
        />
        <span
          className={cn(
            "absolute rounded-full bg-sky-300/40",
            isHorizontal ? "right-1 top-1/2 h-2 w-2 -translate-y-1/2" : "bottom-1 left-1/2 h-2 w-2 -translate-x-1/2",
          )}
        />
        <span
          className={cn(
            "absolute bg-gradient-to-r from-sky-400/0 via-sky-300/50 to-sky-400/0",
            isHorizontal ? "left-4 right-4 top-1/2 h-px -translate-y-1/2" : "top-4 bottom-4 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b",
          )}
        />
        <ArrowRight className={cn("h-5 w-5 animate-pulse", !isHorizontal && "rotate-90")} />
      </div>
    </div>
  );
}
