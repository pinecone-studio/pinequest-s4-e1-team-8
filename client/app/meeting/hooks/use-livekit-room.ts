"use client";

import {
  ConnectionState,
  Room,
  RoomEvent,
  type LocalParticipant,
  type Participant,
  type RemoteParticipant,
} from "livekit-client";
import { useEffect, useRef, useState } from "react";
import {
  getLivekitErrorLogPayload,
  getLivekitRootError,
  getLivekitTokenDiagnostics,
  getLivekitUrlDiagnostics,
  type LivekitTokenDiagnostics,
  type LivekitUrlDiagnostics,
} from "../utils/livekit-diagnostics";

type UseLivekitRoomOptions = {
  livekitUrl?: string;
  token?: string;
};

export const useLivekitRoom = ({
  livekitUrl,
  token,
}: UseLivekitRoomOptions) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [connectionState, setConnectionState] = useState(
    ConnectionState.Disconnected
  );
  const [localParticipant, setLocalParticipant] =
    useState<LocalParticipant | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipant[]
  >([]);
  const [speakingParticipantIdentities, setSpeakingParticipantIdentities] =
    useState<string[]>([]);
  const [participantMediaVersion, setParticipantMediaVersion] = useState(0);
  const [stateTransitions, setStateTransitions] = useState<string[]>([]);
  const [tokenDiagnostics, setTokenDiagnostics] =
    useState<LivekitTokenDiagnostics>({});
  const [urlDiagnostics, setUrlDiagnostics] =
    useState<LivekitUrlDiagnostics | null>(null);
  const [error, setError] = useState("");
  const attemptIdRef = useRef(0);
  const hasActiveConnectRef = useRef(false);

  useEffect(() => {
    if (!livekitUrl || !token) {
      setRoom(null);
      setConnectionState(ConnectionState.Disconnected);
      setLocalParticipant(null);
      setRemoteParticipants([]);
      setSpeakingParticipantIdentities([]);
      setParticipantMediaVersion(0);
      setStateTransitions([ConnectionState.Disconnected]);
      setTokenDiagnostics({});
      setUrlDiagnostics(null);
      setError("");
      return;
    }

    let isActive = true;
    const attemptId = attemptIdRef.current + 1;
    const activeRoom = new Room({
      audioCaptureDefaults: {
        noiseSuppression: true,
        echoCancellation: true,
        autoGainControl: true,
      },
    });
    const currentUrlDiagnostics = getLivekitUrlDiagnostics(livekitUrl);
    const currentTokenDiagnostics = getLivekitTokenDiagnostics(token);

    attemptIdRef.current = attemptId;
    hasActiveConnectRef.current = false;
    setRoom(activeRoom);
    setLocalParticipant(activeRoom.localParticipant);
    setStateTransitions([ConnectionState.Disconnected]);
    setTokenDiagnostics(currentTokenDiagnostics);
    setUrlDiagnostics(currentUrlDiagnostics);

    const syncParticipants = () => {
      if (!isActive || attemptIdRef.current !== attemptId) return;

      setRemoteParticipants(Array.from(activeRoom.remoteParticipants.values()));
    };

    const syncParticipantMedia = () => {
      syncParticipants();
      setParticipantMediaVersion((version) => version + 1);
    };

    const syncActiveSpeakers = (speakers: Participant[] = activeRoom.activeSpeakers) => {
      if (!isActive || attemptIdRef.current !== attemptId) return;

      setSpeakingParticipantIdentities(
        speakers.map((participant) => participant.identity),
      );
    };

    const recordState = (state: ConnectionState) => {
      if (!isActive || attemptIdRef.current !== attemptId) return;

      setConnectionState(state);
      setStateTransitions((current) => [...current, state]);
    };

    const connectRoom = async () => {
      if (hasActiveConnectRef.current) return;

      hasActiveConnectRef.current = true;
      setError("");
      recordState(ConnectionState.Connecting);

      if (!currentUrlDiagnostics.isValid) {
        hasActiveConnectRef.current = false;
        setError(
          `Invalid LiveKit URL: expected ws:// or wss://, received ${currentUrlDiagnostics.href}.`
        );
        recordState(ConnectionState.Disconnected);
        return;
      }

      if (!currentTokenDiagnostics.roomJoin) {
        hasActiveConnectRef.current = false;
        setError("Invalid LiveKit token: roomJoin grant is missing.");
        recordState(ConnectionState.Disconnected);
        return;
      }

      try {
        await activeRoom.connect(currentUrlDiagnostics.href, token);
        hasActiveConnectRef.current = false;

        if (!isActive || attemptIdRef.current !== attemptId) return;

        setConnectionState(activeRoom.state);
        syncParticipants();
        syncActiveSpeakers();
      } catch (caughtError) {
        hasActiveConnectRef.current = false;

        if (!isActive || attemptIdRef.current !== attemptId) return;

        const rootError = getLivekitRootError(caughtError);
        const errorPayload = getLivekitErrorLogPayload(caughtError);

        if (activeRoom.state !== ConnectionState.Connected) {
          console.error("[meeting] LiveKit room.connect failed", {
            error: errorPayload,
            rootError,
            roomState: activeRoom.state,
            token: currentTokenDiagnostics,
            url: currentUrlDiagnostics,
          });

          setError(rootError);
        }

        setConnectionState(activeRoom.state);
      }
    };

    activeRoom
      .on(RoomEvent.ConnectionStateChanged, recordState)
      .on(RoomEvent.ParticipantConnected, syncParticipants)
      .on(RoomEvent.ParticipantDisconnected, syncParticipants)
      .on(RoomEvent.TrackPublished, syncParticipantMedia)
      .on(RoomEvent.TrackUnpublished, syncParticipantMedia)
      .on(RoomEvent.TrackSubscribed, syncParticipantMedia)
      .on(RoomEvent.TrackUnsubscribed, syncParticipantMedia)
      .on(RoomEvent.TrackMuted, syncParticipantMedia)
      .on(RoomEvent.TrackUnmuted, syncParticipantMedia)
      .on(RoomEvent.LocalTrackPublished, syncParticipantMedia)
      .on(RoomEvent.LocalTrackUnpublished, syncParticipantMedia)
      .on(RoomEvent.ActiveSpeakersChanged, syncActiveSpeakers);

    void connectRoom();

    return () => {
      isActive = false;
      hasActiveConnectRef.current = false;
      activeRoom.removeAllListeners();
      void activeRoom.disconnect(true);
    };
  }, [livekitUrl, token]);

  const leaveRoom = async () => {
    await room?.disconnect(true);
    setConnectionState(ConnectionState.Disconnected);
    setLocalParticipant(null);
    setRemoteParticipants([]);
    setSpeakingParticipantIdentities([]);
    setParticipantMediaVersion((version) => version + 1);
  };

  return {
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
  };
};
