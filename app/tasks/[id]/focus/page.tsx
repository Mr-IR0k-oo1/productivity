import { TaskFocusWorkspace } from "@/components/features/TaskFocusWorkspace";

export default async function TaskFocusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <TaskFocusWorkspace taskId={(await params).id} />;
}
