import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

export default function CalendarPage() {
  return (
    <WorkspaceShellPage title="Calendar" subtitle="Schedule planning and sync windows across the workspace.">
      <RouteStubCard
        title="Calendar route stub"
        description="Calendar interactions will be connected to persisted events in a follow-up task."
      />
    </WorkspaceShellPage>
  );
}
