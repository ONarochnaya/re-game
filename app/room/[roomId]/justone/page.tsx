import JustOneGame from "./components/JustOneGame";

// Server Component wrapper, same reason as app/room/[roomId]/codenames/page.tsx:
// this awaits params, and the client game itself must not touch the Promise —
// mixing "use client" with a Promise-typed params prop causes a hydration
// mismatch (the client suspends on first render where the server didn't).
export default async function JustOnePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return <JustOneGame roomId={roomId} />;
}
