import { PreMeetingLobby } from "@/components/meetings/lobby/pre-meeting-lobby";

type LobbyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function LobbyPage({ params }: LobbyPageProps) {
  const { id } = await params;

  return <PreMeetingLobby roomId={id} />;
}
