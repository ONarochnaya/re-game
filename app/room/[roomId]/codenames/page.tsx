export default async function CodenamesPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Screen 3: Codenames</h1>
      <p className="text-sm text-zinc-500">Room: {roomId}</p>
    </main>
  );
}