import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

export default function TimePage() {
  return (
    <WorkspaceShellPage title="Time" subtitle="Time tracking summary and timer actions live in this workspace shell.">
      <RouteStubCard
        title="Time route stub"
        description="Timer controls and entry history will be layered on top of this shell in the next iteration."
      />
    </WorkspaceShellPage>
  );
}
