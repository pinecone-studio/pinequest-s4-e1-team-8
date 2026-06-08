"use client";

import {
  ConnectionState,
  Room,
  RoomEvent,
  type LocalParticipant,
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
  livekitUrl: string;
  token: string;
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
  const [stateTransitions, setStateTransitions] = useState<string[]>([]);
  const [tokenDiagnostics, setTokenDiagnostics] =
    useState<LivekitTokenDiagnostics>({});
  const [urlDiagnostics, setUrlDiagnostics] =
    useState<LivekitUrlDiagnostics | null>(null);
  const [error, setError] = useState("");
  const attemptIdRef = useRef(0);
  const hasActiveConnectRef = useRef(false);

  useEffect(() => {
    let isActive = true;
    const attemptId = attemptIdRef.current + 1;
    const activeRoom = new Room();
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
      .on(RoomEvent.TrackPublished, syncParticipants)
      .on(RoomEvent.TrackUnpublished, syncParticipants)
      .on(RoomEvent.TrackSubscribed, syncParticipants)
      .on(RoomEvent.TrackUnsubscribed, syncParticipants)
      .on(RoomEvent.LocalTrackPublished, syncParticipants)
      .on(RoomEvent.LocalTrackUnpublished, syncParticipants);

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
  };

  return {
    connectionState,
    error,
    leaveRoom,
    localParticipant,
    remoteParticipants,
    room,
    stateTransitions,
    tokenDiagnostics,
    urlDiagnostics,
  };
};
