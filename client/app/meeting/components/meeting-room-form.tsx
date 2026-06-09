"use client";

import { useUser } from "@clerk/nextjs";
import { Headphones } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createMeetingRoom,
  joinMeetingRoom,
} from "../index";
import type { MeetingRoomListItem } from "../types/meeting-room.types";
import { ConnectedMeetingPanel } from "./connected-meeting-panel";
import { FormField } from "./form-field";
import { useMeetingSession } from "./meeting-session-provider";

type MeetingJoinStatus = "idle" | "joining";

type MeetingRoomFormProps = {
  selectedRoom: Pick<MeetingRoomListItem, "meetingId" | "roomName"> | null;
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

const getClerkDisplayName = (user: ReturnType<typeof useUser>["user"]) => {
  if (!user) return "";

  return (
    user.fullName?.trim() ||
    user.username?.trim() ||
    user.primaryEmailAddress?.emailAddress?.trim() ||
    ""
  );
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

export const MeetingRoomForm = ({ selectedRoom }: MeetingRoomFormProps) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const authenticatedName = useMemo(() => getClerkDisplayName(user), [user]);
  const resolvedDisplayName = isSignedIn
    ? authenticatedName || "User"
    : "";
  const [manualDisplayName, setManualDisplayName] = useState("");
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
  const displayName = resolvedDisplayName || manualDisplayName.trim();
  const requiresDisplayName = isLoaded && !isSignedIn && !manualDisplayName.trim();

  useEffect(() => {
    setError("");
  }, [selectedRoom, selectedRoomKey]);

  const joinSelectedRoom = useCallback(
    async (participantName: string) => {
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
      <ConnectedMeetingPanel
        meetingId={activeSession.meetingId}
        onLeave={() => undefined}
        response={activeSession.response}
      />
    );
  }

  if (!selectedRoom) {
    return (
      <section className="m-auto w-full max-w-xs space-y-4 rounded-2xl border border-border/60 bg-card p-6 text-center shadow-sm">
        <div className="mx-auto flex size-11 items-center justify-center rounded-xl bg-muted">
          <Headphones className="size-5 stroke-[1.75] text-violet-700 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-[15px] font-semibold text-foreground">
            Select a channel
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a voice channel from the sidebar to join.
          </p>
        </div>
      </section>
    );
  }

  if (requiresDisplayName) {
    return (
      <section className="m-auto w-full max-w-sm space-y-5 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-400">
            {selectedRoom.roomName}
          </p>
          <h1 className="mt-1 text-[15px] font-semibold text-foreground">
            Enter display name
          </h1>
        </div>
        <FormField
          label="Display name"
          onChange={(event) => setManualDisplayName(event.target.value)}
          required
          value={manualDisplayName}
        />

        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-100 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <button
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!manualDisplayName.trim() || joinStatus === "joining"}
          onClick={() => {
            void joinSelectedRoom(manualDisplayName);
          }}
          type="button"
        >
          {joinStatus === "joining" ? "Joining..." : "Join channel"}
        </button>
      </section>
    );
  }

  return (
    <section className="m-auto w-full max-w-sm space-y-4 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-400">
          {selectedRoom.roomName}
        </p>
        <h1 className="mt-1 text-[15px] font-semibold text-foreground">
          {joinStatus === "joining" ? "Joining channel..." : "Ready to join"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {joinStatus === "joining"
            ? `Connecting as ${displayName || "User"}`
            : `Join as ${displayName || "User"}`}
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-400/30 bg-red-100 dark:bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={joinStatus === "joining" || !displayName}
        onClick={() => {
          void joinSelectedRoom(displayName);
        }}
        type="button"
      >
        {joinStatus === "joining" ? "Joining..." : "Join channel"}
      </button>
    </section>
  );
};
