import { MeetingPageContent } from "./components/meeting-page-content";

type MeetingPageProps = {
  searchParams: Promise<{
    autoRecord?: string;
    meetingId?: string;
    roomName?: string;
  }>;
};

const MeetingPage = async ({ searchParams }: MeetingPageProps) => {
  const params = await searchParams;
  const selectedRoom =
    params.meetingId && params.roomName
      ? {
          meetingId: params.meetingId,
          roomName: params.roomName,
        }
      : null;

  return (
    <MeetingPageContent
      autoRecord={params.autoRecord === "1"}
      selectedRoom={selectedRoom}
    />
  );
};

export default MeetingPage;
