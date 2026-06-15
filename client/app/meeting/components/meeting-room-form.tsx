"use client";

import { useUser } from "@clerk/nextjs";
import { Headphones } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LobbyCanvas } from "@/components/meetings/lobby/lobby-canvas";
import {
  createMeetingRoom,
  joinMeetingRoom,
} from "../index";
import type { MeetingRoomListItem } from "../types/meeting-room.types";
import { slugifyRoomName } from "../utils/slugify-room-name";
import type { TranscriptLanguage } from "../utils/transcript-language";
import { ConnectedMeetingPanel } from "./connected-meeting-panel";
import { FormField } from "./form-field";
import { MeetingPreJoinLobby } from "./meeting-pre-join-lobby";
import { useMeetingSession } from "./meeting-session-provider";

type MeetingJoinStatus = "idle" | "joining";

type MeetingRoomFormProps = {
  autoRecord?: boolean;
  selectedRoom: Pick<MeetingRoomListItem, "meetingId" | "roomName"> | null;
  transcriptLanguage?: TranscriptLanguage;
};

const LIVEKIT_PLACEHOLDER_HOST = ["your-project", "livekit", "cloud"].join(".");

const getSafeLivekitUrl = (url: string) => {
  if (url) {
    try {
      if (new URL(url).host !== LIVEKIT_PLACEHOLDER_HOST) return url;
    } catch {
      return url;
    }
  }

  return process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "";
};

const getParticipantIdentity = ({
  displayName,
  user,
}: {
  displayName: string;
  user: ReturnType<typeof useUser>["user"];
}) => {
  const stableId =
    user?.id ||
    user?.primaryEmailAddress?.emailAddress ||
    displayName.toLowerCase();

  return `${displayName.trim()}__${stableId}`;
};

export const MeetingRoomForm = ({
  autoRecord,
  selectedRoom,
  transcriptLanguage,
}: MeetingRoomFormProps) => {
  const router = useRouter();
  const { user } = useUser();
  const [roomTitle, setRoomTitle] = useState("");
  const [joinStatus, setJoinStatus] = useState<MeetingJoinStatus>("idle");
  const [error, setError] = useState("");
  const { activeSession, startMeetingSession } = useMeetingSession();
  const selectedRoomKey = selectedRoom
    ? `${selectedRoom.meetingId}:${selectedRoom.roomName}`
    : "";
  const activeSessionRoomKey = activeSession
    ? `${activeSession.meetingId}:${
        activeSession.response.displayRoomName ?? activeSession.response.roomName
      }`
    : "";

  useEffect(() => {
    setError("");
  }, [selectedRoom, selectedRoomKey]);

  const joinSelectedRoom = useCallback(
    async (
      participantName: string,
      preferences: { isCameraEnabled: boolean; isMicrophoneEnabled: boolean },
    ) => {
      if (!selectedRoom || !participantName.trim()) return;

      setError("");
      setJoinStatus("joining");

      try {
        const participantIdentity = getParticipantIdentity({
          displayName: participantName,
          user,
        });
        const livekitRoomName = selectedRoom.meetingId;
        const result = await joinMeetingRoom({
          participantName: participantIdentity,
          roomName: livekitRoomName,
        });

        startMeetingSession({
          initialCameraEnabled: preferences.isCameraEnabled,
          initialMicrophoneEnabled: preferences.isMicrophoneEnabled,
          meetingId: selectedRoom.meetingId,
          participantName: participantIdentity,
          response: {
            ...result,
            displayRoomName: selectedRoom.roomName,
            url: getSafeLivekitUrl(result.url),
          },
        });
      } catch {
        try {
          const participantIdentity = getParticipantIdentity({
            displayName: participantName,
            user,
          });
          const livekitRoomName = selectedRoom.meetingId;
          const result = await createMeetingRoom({
            hostName: participantIdentity,
            roomName: livekitRoomName,
          });

          startMeetingSession({
            initialCameraEnabled: preferences.isCameraEnabled,
            initialMicrophoneEnabled: preferences.isMicrophoneEnabled,
            meetingId: selectedRoom.meetingId,
            participantName: participantIdentity,
            response: {
              ...result,
              displayRoomName: selectedRoom.roomName,
              url: getSafeLivekitUrl(result.url),
            },
          });
        } catch (caughtError) {
          setError((caughtError as Error).message);
        }
      } finally {
        setJoinStatus("idle");
      }
    },
    [selectedRoom, startMeetingSession, user],
  );

  if (activeSession && (!selectedRoom || selectedRoomKey === activeSessionRoomKey)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-6">
        <div className="flex h-[92vh] w-full max-w-7xl flex-col">
          <ConnectedMeetingPanel
            autoRecord={autoRecord}
            meetingId={activeSession.meetingId}
            onLeave={() => undefined}
            response={activeSession.response}
            transcriptLanguage={transcriptLanguage}
          />
        </div>
      </div>
    );
  }

  if (!selectedRoom) {
    const roomSlug = slugifyRoomName(roomTitle);

    const handleCreateMeeting = (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!roomSlug) return;

      const params = new URLSearchParams({
        meetingId: roomSlug,
        roomName: roomTitle.trim(),
      });

      router.push(`/meeting?${params.toString()}`);
    };

    return (
      <LobbyCanvas className="min-h-screen">
        <section className="m-auto w-full max-w-sm space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted">
            <Headphones className="size-5 stroke-[1.75] text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-[15px] font-semibold text-foreground">
              Start a meeting
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Name your meeting to create a room and share it with others.
            </p>
          </div>
          <form className="space-y-4" onSubmit={handleCreateMeeting}>
            <FormField
              label="Meeting title"
              onChange={(event) => setRoomTitle(event.target.value)}
              required
              value={roomTitle}
            />
            <Button className="w-full" disabled={!roomSlug} type="submit">
              Continue
            </Button>
          </form>
        </section>
      </LobbyCanvas>
    );
  }

  return (
    <MeetingPreJoinLobby
      error={error}
      isJoining={joinStatus === "joining"}
      onJoin={({ displayName, isCameraEnabled, isMicrophoneEnabled }) => {
        void joinSelectedRoom(displayName, { isCameraEnabled, isMicrophoneEnabled });
      }}
      roomName={selectedRoom.roomName}
    />
  );
};
