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
    <main className="flex min-h-screen flex-col bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <MeetingRoomForm
          autoRecord={autoRecord}
          selectedRoom={selectedRoom}
          transcriptLanguage={transcriptLanguage}
        />
      </div>
    </main>
  );
};
