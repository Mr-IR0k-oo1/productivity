import FlowchartEditor from "@/components/flowchart/FlowchartEditor";

export default async function FlowchartEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <FlowchartEditor flowchartId={id} />;
}
