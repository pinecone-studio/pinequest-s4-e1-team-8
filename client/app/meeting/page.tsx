import { MeetingPageContent } from "./components/meeting-page-content";
import { parseTranscriptLanguage } from "./utils/transcript-language";

type MeetingPageProps = {
  searchParams: Promise<{
    autoRecord?: string;
    lang?: string;
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
      transcriptLanguage={parseTranscriptLanguage(params.lang)}
    />
  );
};

export default MeetingPage;
