"use client";

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
import type { MeetingRoomTokenResponse } from "../index";
import { useLivekitRoom } from "../hooks/use-livekit-room";
import type {
  LivekitTokenDiagnostics,
  LivekitUrlDiagnostics,
} from "../utils/livekit-diagnostics";
import { useMeetingChannelPresence } from "./meeting-channel-presence-provider";
import { getParticipantDisplayName } from "./participant-tile";

type ActiveMeetingSession = {
  meetingId: string;
  response: MeetingRoomTokenResponse;
};

export type MeetingSessionParticipant = {
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

export function MeetingSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeSession, setActiveSession] =
    useState<ActiveMeetingSession | null>(null);
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
    },
    [],
  );

  const leaveActiveSession = useCallback(async () => {
    await leaveRoom();
    setActiveSession(null);
    clearJoinedChannel();
  }, [clearJoinedChannel, leaveRoom]);

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
