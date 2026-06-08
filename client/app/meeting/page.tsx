import { MeetingPageContent } from "./components/meeting-page-content";
import { predefinedMeetingRooms } from "./predefined-meeting-rooms";

type MeetingPageProps = {
  searchParams: Promise<{
    meetingId?: string;
    roomName?: string;
  }>;
};

const MeetingPage = async ({ searchParams }: MeetingPageProps) => {
  const params = await searchParams;
  const predefinedRoom = predefinedMeetingRooms.find(
    (room) => room.roomName === params.roomName,
  );
  const selectedRoom = predefinedRoom
    ? {
        meetingId: predefinedRoom.meetingId,
        roomName: predefinedRoom.roomName,
      }
    : params.meetingId && params.roomName
      ? {
          meetingId: params.meetingId,
          roomName: params.roomName,
        }
      : null;

  return <MeetingPageContent selectedRoom={selectedRoom} />;
};

export default MeetingPage;
