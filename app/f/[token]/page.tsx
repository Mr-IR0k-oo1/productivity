import FlowchartEditor from "@/components/flowchart/FlowchartEditor";

export default async function PublicFlowchartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <FlowchartEditor publicToken={token} />;
}
