import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

export default function ReportsPage() {
  return (
    <WorkspaceShellPage title="Reports" subtitle="View delivery and utilization insights from a shared shell layout.">
      <RouteStubCard
        title="Reports route stub"
        description="Charts, filters, and exports will be attached to this route once reporting data APIs are available."
      />
    </WorkspaceShellPage>
  );
}
