"use client";

import { useUser } from "@clerk/nextjs";
import {
  ConnectionState,
  type LocalParticipant,
  type RemoteParticipant,
  type Room,
} from "livekit-client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { joinMeetingRoom } from "../api/join-meeting-room";
import type { MeetingRoomTokenResponse } from "../types/meeting-response.types";
import { useLivekitRoom } from "../hooks/use-livekit-room";
import type {
  LivekitTokenDiagnostics,
  LivekitUrlDiagnostics,
} from "../utils/livekit-diagnostics";
import { useMeetingChannelPresence } from "./meeting-channel-presence-provider";
import { ParticipantAudio } from "./participant-audio";
import { getParticipantDisplayName } from "./participant-tile";

type ActiveMeetingSession = {
  meetingId: string;
  participantName: string;
  response: MeetingRoomTokenResponse;
};

export type MeetingSessionParticipant = {
  avatarUrl?: string;
  displayName: string;
  identity: string;
  isCameraEnabled: boolean;
  isLocal: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean;
  isSpeaking: boolean;
};

type StartMeetingSessionInput = ActiveMeetingSession;

type MeetingSessionContextValue = {
  activeSession: ActiveMeetingSession | null;
  activeSessionHref: string;
  activeSessionRoomName: string;
  connectionState: ConnectionState;
  error: string;
  leaveActiveSession: () => Promise<void>;
  localParticipant: LocalParticipant | null;
  participants: MeetingSessionParticipant[];
  remoteParticipants: RemoteParticipant[];
  room: Room | null;
  startMeetingSession: (session: StartMeetingSessionInput) => void;
  stateTransitions: string[];
  tokenDiagnostics: LivekitTokenDiagnostics;
  urlDiagnostics: LivekitUrlDiagnostics | null;
};

const MeetingSessionContext =
  createContext<MeetingSessionContextValue | null>(null);

const MEETING_SESSION_STORAGE_KEY = "active-meeting-session";
const LIVEKIT_PLACEHOLDER_HOST = ["your-project", "livekit", "cloud"].join(".");

type StoredMeetingSession = {
  meetingId: string;
  participantName: string;
  roomName: string;
};

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

const readStoredMeetingSession = () => {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = window.sessionStorage.getItem(MEETING_SESSION_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<StoredMeetingSession>;

    if (
      typeof parsed.meetingId !== "string" ||
      typeof parsed.participantName !== "string" ||
      typeof parsed.roomName !== "string" ||
      !parsed.meetingId.trim() ||
      !parsed.participantName.trim() ||
      !parsed.roomName.trim()
    ) {
      return null;
    }

    return {
      meetingId: parsed.meetingId,
      participantName: parsed.participantName,
      roomName: parsed.roomName,
    };
  } catch {
    return null;
  }
};

const writeStoredMeetingSession = (session: StoredMeetingSession) => {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    MEETING_SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
};

const clearStoredMeetingSession = () => {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(MEETING_SESSION_STORAGE_KEY);
};

export function MeetingSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useUser();
  const [activeSession, setActiveSession] =
    useState<ActiveMeetingSession | null>(null);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(false);
  const localAvatarUrl = user?.imageUrl || undefined;
  const {
    clearJoinedChannel,
    setJoinedChannel,
    setJoinedChannelParticipants,
  } = useMeetingChannelPresence();
  const {
    connectionState,
    error,
    leaveRoom,
    localParticipant,
    participantMediaVersion,
    remoteParticipants,
    room,
    speakingParticipantIdentities,
    stateTransitions,
    tokenDiagnostics,
    urlDiagnostics,
  } = useLivekitRoom({
    livekitUrl: activeSession?.response.url,
    token: activeSession?.response.token,
  });
  const roomName =
    activeSession?.response.displayRoomName ?? activeSession?.response.roomName;
  const activeSessionHref = useMemo(() => {
    if (!activeSession || !roomName) return "";

    const params = new URLSearchParams({
      meetingId: activeSession.meetingId,
      roomName,
    });

    return `/meeting?${params.toString()}`;
  }, [activeSession, roomName]);
  const participants = useMemo<MeetingSessionParticipant[]>(
    () => {
      void participantMediaVersion;

      return activeSession
        ? [
            ...(localParticipant ? [localParticipant] : []),
            ...remoteParticipants,
          ].map((participant) => ({
            avatarUrl: participant.isLocal ? localAvatarUrl : undefined,
            displayName: participant.isLocal
              ? "You"
              : getParticipantDisplayName(participant),
            identity: participant.identity,
            isCameraEnabled: participant.isCameraEnabled,
            isLocal: participant.isLocal,
            isMicrophoneEnabled: participant.isMicrophoneEnabled,
            isScreenSharing: participant.isScreenShareEnabled,
            isSpeaking: speakingParticipantIdentities.includes(
              participant.identity,
            ),
          }))
        : [];
    },
    [
      activeSession,
      localParticipant,
      localAvatarUrl,
      participantMediaVersion,
      remoteParticipants,
      speakingParticipantIdentities,
    ],
  );

  useEffect(() => {
    if (
      !activeSession ||
      !roomName ||
      connectionState !== ConnectionState.Connected
    ) {
      return;
    }

    setJoinedChannel({
      meetingId: activeSession.meetingId,
      roomName,
    });
  }, [
    activeSession,
    connectionState,
    roomName,
    setJoinedChannel,
  ]);

  useEffect(() => {
    if (!activeSession) {
      clearJoinedChannel();
      return;
    }

    setJoinedChannelParticipants(participants);
  }, [
    activeSession,
    clearJoinedChannel,
    participants,
    setJoinedChannelParticipants,
  ]);

  const startMeetingSession = useCallback(
    (session: StartMeetingSessionInput) => {
      setActiveSession(session);
      writeStoredMeetingSession({
        meetingId: session.meetingId,
        participantName: session.participantName,
        roomName: session.response.displayRoomName ?? session.response.roomName,
      });
    },
    [],
  );

  const leaveActiveSession = useCallback(async () => {
    await leaveRoom();
    setActiveSession(null);
    clearStoredMeetingSession();
    clearJoinedChannel();
  }, [clearJoinedChannel, leaveRoom]);

  useEffect(() => {
    if (hasAttemptedRestore || activeSession) return;

    setHasAttemptedRestore(true);

    const storedSession = readStoredMeetingSession();
    if (!storedSession) return;

    let isActive = true;

    const restoreMeetingSession = async () => {
      try {
        const response = await joinMeetingRoom({
          participantName: storedSession.participantName,
          roomName: storedSession.meetingId,
        });

        if (!isActive) return;

        startMeetingSession({
          meetingId: storedSession.meetingId,
          participantName: storedSession.participantName,
          response: {
            ...response,
            displayRoomName: storedSession.roomName,
            url: getSafeLivekitUrl(response.url),
          },
        });
      } catch (caughtError) {
        console.warn("[meeting] Could not restore meeting session", caughtError);
        clearStoredMeetingSession();
      }
    };

    void restoreMeetingSession();

    return () => {
      isActive = false;
    };
  }, [activeSession, hasAttemptedRestore, startMeetingSession]);

  const value = useMemo(
    () => ({
      activeSession,
      activeSessionHref,
      activeSessionRoomName: roomName ?? "",
      connectionState,
      error,
      leaveActiveSession,
      localParticipant,
      participants,
      remoteParticipants,
      room,
      startMeetingSession,
      stateTransitions,
      tokenDiagnostics,
      urlDiagnostics,
    }),
    [
      activeSession,
      activeSessionHref,
      connectionState,
      error,
      leaveActiveSession,
      localParticipant,
      participants,
      remoteParticipants,
      room,
      roomName,
      startMeetingSession,
      stateTransitions,
      tokenDiagnostics,
      urlDiagnostics,
    ],
  );

  return (
    <MeetingSessionContext.Provider value={value}>
      {children}
      <div aria-hidden className="fixed size-0 overflow-hidden">
        {remoteParticipants.map((participant) => (
          <ParticipantAudio
            key={participant.identity}
            participant={participant}
            version={participantMediaVersion}
          />
        ))}
      </div>
    </MeetingSessionContext.Provider>
  );
}

export function useMeetingSession() {
  const context = useContext(MeetingSessionContext);

  if (!context) {
    throw new Error(
      "useMeetingSession must be used within MeetingSessionProvider",
    );
  }

  return context;
}
