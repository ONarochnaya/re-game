import CodenamesGame from "./components/CodenamesGame";

export default async function CodenamesPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return <CodenamesGame roomId={roomId} />;
}
