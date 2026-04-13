import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

export default function SettingsPage() {
  return (
    <WorkspaceShellPage title="Settings" subtitle="Manage workspace controls in the same shell used across all routes.">
      <RouteStubCard
        title="Settings route stub"
        description="Profile, billing, and notification controls will be reconnected to this shell in upcoming tasks."
      />
    </WorkspaceShellPage>
  );
}
