export default async function TwoTruths1LiePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Two Truths and a Lie</h1>
      <p className="text-sm text-zinc-500">Room: {roomId}</p>
    </main>
  );
}
