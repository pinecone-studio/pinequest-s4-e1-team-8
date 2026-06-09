import { MeetingRoomForm } from "./meeting-room-form";
import type { MeetingRoomListItem } from "../types/meeting-room.types";

type MeetingPageContentProps = {
  selectedRoom: Pick<MeetingRoomListItem, "meetingId" | "roomName"> | null;
};

export const MeetingPageContent = ({ selectedRoom }: MeetingPageContentProps) => (
  <main className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
      <MeetingRoomForm selectedRoom={selectedRoom} />
    </div>
  </main>
);
