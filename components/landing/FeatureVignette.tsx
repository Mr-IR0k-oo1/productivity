import {
  BacklogVignette,
  BoardVignette,
  FlowVignette,
  IdeasVignette,
  ReportsVignette,
} from "@/components/landing/vignettes";
import type { VignetteName } from "@/lib/marketing/features";

const vignettes: Record<VignetteName, () => React.JSX.Element> = {
  backlog: BacklogVignette,
  board: BoardVignette,
  ideas: IdeasVignette,
  flow: FlowVignette,
  reports: ReportsVignette,
};

export function FeatureVignette({ name }: { name: VignetteName }) {
  const Vignette = vignettes[name];
  return <Vignette />;
}
