export default function IdeaDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-slate-500 flex items-center justify-center">
      <h1 className="text-2xl text-white">Idea ID: {params.id}</h1>
    </div>
  );
}