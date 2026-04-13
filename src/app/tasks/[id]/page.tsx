import Link from "next/link";

import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  return (
    <WorkspaceShellPage title={`Task ${id}`} subtitle="Route stub wired to the shared workspace shell.">
      <RouteStubCard
        title="Task detail stub"
        description="Task properties, assignees, and timeline data will be rendered on this route."
      >
        <Link href="/tasks" className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline">
          Back to tasks
        </Link>
      </RouteStubCard>
    </WorkspaceShellPage>
  );
}
