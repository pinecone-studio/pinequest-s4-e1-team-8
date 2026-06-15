"use client";

import { useClientApiAuth } from "@/lib/api/auth-interceptor";
import type { MeetingRoomListItem } from "../types/meeting-room.types";
import type { TranscriptLanguage } from "../utils/transcript-language";
import { MeetingRoomForm } from "./meeting-room-form";

type MeetingPageContentProps = {
  autoRecord?: boolean;
  selectedRoom: Pick<MeetingRoomListItem, "meetingId" | "roomName"> | null;
  transcriptLanguage?: TranscriptLanguage;
};

export const MeetingPageContent = ({
  autoRecord,
  selectedRoom,
  transcriptLanguage,
}: MeetingPageContentProps) => {
  useClientApiAuth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <MeetingRoomForm
        autoRecord={autoRecord}
        selectedRoom={selectedRoom}
        transcriptLanguage={transcriptLanguage}
      />
    </main>
  );
};
