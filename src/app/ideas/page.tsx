import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { RouteStubCard, WorkspaceShellPage } from "@/components/layout";

interface IdeaStub {
  id: string;
  title: string;
  status: "Draft" | "Planned" | "In review";
}

const ideaStubs: IdeaStub[] = [
  { id: "idea-001", title: "Workflow automation", status: "Draft" },
  { id: "idea-002", title: "Onboarding checklist", status: "Planned" },
  { id: "idea-003", title: "Weekly scorecard", status: "In review" },
];

export default function IdeasPage() {
  return (
    <WorkspaceShellPage title="Ideas" subtitle="Capture and review ideas before planning work.">
      <RouteStubCard title="Idea workspace" description="Select an idea to open its detail route stub.">
        <ul className="space-y-2">
          {ideaStubs.map((idea) => (
            <li key={idea.id}>
              <Link
                href={`/ideas/${idea.id}`}
                className="flex items-center justify-between rounded-md border border-white/10 bg-[#0d0d0d] px-3 py-2 text-sm transition-colors hover:bg-[#161616]"
              >
                <span className="font-medium text-white">{idea.title}</span>
                <span className="flex items-center gap-2 text-neutral-400">
                  {idea.status}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </RouteStubCard>
    </WorkspaceShellPage>
  );
}
