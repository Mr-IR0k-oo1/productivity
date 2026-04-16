import TaskFocusWorkspace from "@/components/features/TaskFocusWorkspace";

type TaskDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailsPage({ params }: TaskDetailsPageProps) {
  const { id } = await params;

  return <TaskFocusWorkspace taskId={id} />;
}
