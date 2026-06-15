import { RoomView } from "./room-view";

type RoomPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cam?: string; mic?: string; name?: string }>;
};

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { id } = await params;
  const { cam, mic, name } = await searchParams;

  return (
    <RoomView
      initialCameraOn={cam !== "0"}
      initialMicOn={mic !== "0"}
      initialName={name}
      roomId={id}
    />
  );
}
