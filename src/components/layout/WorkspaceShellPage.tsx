import { type ReactNode } from "react";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { WorkspaceHeader } from "@/components/layout/WorkspaceHeader";

interface WorkspaceShellPageProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function WorkspaceShellPage({ title, subtitle, actions, children }: WorkspaceShellPageProps) {
  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <WorkspaceHeader title={title} subtitle={subtitle} />
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {children}
      </div>
    </DashboardLayout>
  );
}
