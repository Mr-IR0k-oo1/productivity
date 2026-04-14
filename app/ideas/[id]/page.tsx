type IdeaDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function IdeaDetailsPage({ params }: IdeaDetailsPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-3 page-animate">
      <h1 className="text-2xl font-bold">Idea {id}</h1>
      <p className="text-zinc-400">Detail view scaffold with room for notes, comments, and conversion.</p>
    </div>
  );
}
