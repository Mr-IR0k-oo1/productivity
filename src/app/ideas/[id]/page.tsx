import Link from "next/link";

import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

interface IdeaDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function IdeaDetailPage({ params }: IdeaDetailPageProps) {
  const { id } = await params;

  return (
    <WorkspaceShellPage title={`Idea ${id}`} subtitle="Route stub wired to the shared workspace shell.">
      <RouteStubCard
        title="Idea detail stub"
        description="Idea metadata, comments, and activity timeline will be connected here."
      >
        <Link href="/ideas" className="text-sm text-neutral-300 underline-offset-4 hover:text-white hover:underline">
          Back to ideas
        </Link>
      </RouteStubCard>
    </WorkspaceShellPage>
  );
}
