type TaskDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TaskDetailsPage({ params }: TaskDetailsPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-3 page-animate">
      <h1 className="text-2xl font-bold">Task {id}</h1>
      <p className="text-zinc-400">Task detail scaffold with dependencies and activity timeline.</p>
    </div>
  );
}
