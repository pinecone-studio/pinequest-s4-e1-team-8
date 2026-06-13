"use client";

import {
  ConnectionState,
  ParticipantEvent,
  Track,
  type Participant,
} from "livekit-client";
import {
  Mic,
  MicOff,
  PhoneOff,
  Radio,
  ScreenShare,
  ScreenShareOff,
  Users,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useMeetingSession } from "./meeting-session-provider";
import {
  getParticipantDisplayName,
  ParticipantTile,
} from "./participant-tile";
import { RecordingControls, type RecordingStatus } from "./recording-controls";

type LivekitRoomViewProps = {
  autoRecord?: boolean;
  livekitRoomName: string;
  meetingId: string;
  onLeave: () => void;
  roomName: string;
};

export const LivekitRoomView = ({
  autoRecord,
  livekitRoomName,
  meetingId,
  onLeave,
  roomName,
}: LivekitRoomViewProps) => {
  const {
    connectionState,
    error,
    leaveActiveSession,
    localParticipant,
    participants,
    remoteParticipants,
    room,
  } = useMeetingSession();
  const isConnecting = connectionState === ConnectionState.Connecting;
  const isConnected = connectionState === ConnectionState.Connected;
  const participantCount = (localParticipant ? 1 : 0) + remoteParticipants.length;
  const allParticipants = useMemo(
    () => [
      ...(localParticipant ? [localParticipant] : []),
      ...remoteParticipants,
    ],
    [localParticipant, remoteParticipants],
  );
  const localScreenShareEnabled = Boolean(localParticipant?.isScreenShareEnabled);
  const screenShareParticipants = useMemo(
    () => [
      ...(localScreenShareEnabled && localParticipant ? [localParticipant] : []),
      ...remoteParticipants.filter((participant) => participant.isScreenShareEnabled),
    ],
    [
      localParticipant,
      localScreenShareEnabled,
      remoteParticipants,
    ],
  );
  const isScreenSharing = Boolean(localParticipant?.isScreenShareEnabled);
  const [focusedScreenShareIdentity, setFocusedScreenShareIdentity] = useState<
    string | null
  >(null);
  const [focusedParticipantIdentity, setFocusedParticipantIdentity] = useState<
    string | null
  >(null);
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("not-started");
  const screenShareParticipantKey = screenShareParticipants
    .map((participant) => participant.identity)
    .join("|");
  const focusedScreenShareParticipant =
    screenShareParticipants.find(
      (participant) => participant.identity === focusedScreenShareIdentity,
    ) ?? null;
  const focusedParticipant =
    allParticipants.find(
      (participant) => participant.identity === focusedParticipantIdentity,
    ) ??
    remoteParticipants[0] ??
    localParticipant ??
    null;
  const stageParticipant = focusedScreenShareParticipant ?? focusedParticipant;
  const stageMode = focusedScreenShareParticipant ? "screen" : "camera";
  const shouldShowThumbnails =
    participantCount > 1 || screenShareParticipants.length > 0;
  const thumbnailParticipants =
    stageMode === "screen"
      ? allParticipants
      : allParticipants.filter(
          (participant) => participant.identity !== stageParticipant?.identity,
        );
  const recordingLabel =
    recordingStatus === "active"
      ? "Recording"
      : recordingStatus === "ready"
        ? "Recording ready"
        : "Not recording";
  const recordingBadgeClassName =
    recordingStatus === "active"
      ? "border-destructive/30 bg-destructive/10 text-destructive"
      : recordingStatus === "ready"
        ? "border-sage bg-sage text-sage-foreground"
        : "border-border bg-muted/50 text-muted-foreground";
  const connectionLabel = isConnecting
    ? "Connecting..."
    : isConnected
      ? "Connected"
      : connectionState === ConnectionState.Reconnecting
        ? "Reconnecting..."
        : "Disconnected";

  useEffect(() => {
    if (
      focusedScreenShareIdentity &&
      !screenShareParticipants.some(
        (participant) => participant.identity === focusedScreenShareIdentity,
      )
    ) {
      setFocusedScreenShareIdentity(null);
    }
  }, [focusedScreenShareIdentity, screenShareParticipantKey, screenShareParticipants]);

  useEffect(() => {
    if (
      focusedParticipantIdentity &&
      !allParticipants.some(
        (participant) => participant.identity === focusedParticipantIdentity,
      )
    ) {
      setFocusedParticipantIdentity(null);
    }
  }, [allParticipants, focusedParticipantIdentity]);

  // LiveKit mutates localParticipant in place — subscribe to track events so
  // the control bar re-renders when mic/camera state actually changes.
  const [, setLocalVersion] = useState(0);
  const [pendingMediaToggle, setPendingMediaToggle] = useState<
    "camera" | "microphone" | "screen" | null
  >(null);
  useEffect(() => {
    if (!localParticipant) return;
    const refresh = () => setLocalVersion((v) => v + 1);
    localParticipant
      .on(ParticipantEvent.TrackMuted, refresh)
      .on(ParticipantEvent.TrackUnmuted, refresh)
      .on(ParticipantEvent.LocalTrackPublished, refresh)
      .on(ParticipantEvent.LocalTrackUnpublished, refresh);
    return () => {
      localParticipant
        .off(ParticipantEvent.TrackMuted, refresh)
        .off(ParticipantEvent.TrackUnmuted, refresh)
        .off(ParticipantEvent.LocalTrackPublished, refresh)
        .off(ParticipantEvent.LocalTrackUnpublished, refresh);
    };
  }, [localParticipant]);

  const handleLeave = async () => {
    await leaveActiveSession();
    onLeave();
  };

  const toggleMicrophone = async () => {
    if (!localParticipant || pendingMediaToggle) return;

    setPendingMediaToggle("microphone");
    try {
      await localParticipant.setMicrophoneEnabled(
        !localParticipant.isMicrophoneEnabled,
      );
      setLocalVersion((v) => v + 1);
    } finally {
      setPendingMediaToggle(null);
    }
  };

  const toggleCamera = async () => {
    if (!localParticipant || pendingMediaToggle) return;

    setPendingMediaToggle("camera");
    try {
      await localParticipant.setCameraEnabled(!localParticipant.isCameraEnabled);
      setLocalVersion((v) => v + 1);
    } finally {
      setPendingMediaToggle(null);
    }
  };

  const toggleScreenShare = async () => {
    if (!room || !localParticipant || pendingMediaToggle) return;

    setPendingMediaToggle("screen");
    try {
      await room.localParticipant.setScreenShareEnabled(!isScreenSharing);
      setLocalVersion((v) => v + 1);
    } catch (caughtError) {
      console.warn("[meeting] Screen share toggle failed", caughtError);
      setLocalVersion((v) => v + 1);
    } finally {
      setPendingMediaToggle(null);
    }
  };

  const getScreenShareLabel = (participant: typeof screenShareParticipants[number]) =>
    participant.isLocal
      ? "Your screen"
      : `${getParticipantDisplayName(participant)}'s screen`;

  const getParticipantLabel = (participant: Participant) =>
    participant.isLocal ? "You" : getParticipantDisplayName(participant);

  return (
    <section className="flex min-h-[calc(100vh-3rem)] w-full flex-1 flex-col overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-xl dark:shadow-2xl dark:shadow-black/30">
      <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-muted/20 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-base font-semibold tracking-tight">
            {roomName}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            {isConnected ? (
              <span className="size-1.5 shrink-0 rounded-full bg-sage-foreground" />
            ) : null}
            {connectionLabel}
            <span className="text-muted-foreground">/</span>
            ID {meetingId}
          </p>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5 text-primary" />
            {participantCount}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${recordingBadgeClassName}`}
          >
            <Radio className="size-3.5" />
            {recordingLabel}
          </span>
          {screenShareParticipants.length ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
              <ScreenShare className="size-3.5" />
              Screen share live
            </span>
          ) : null}
        </div>
      </header>

      {isConnecting ? (
        <p className="mx-4 mt-4 rounded-xl border border-primary/20 bg-primary/10 p-3 text-sm text-primary">
          Connecting...
        </p>
      ) : null}
      {error ? (
        <div className="mx-4 mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          {screenShareParticipants.length ? (
            <div className="flex shrink-0 gap-2 overflow-x-auto rounded-2xl border border-border bg-muted/20 p-2">
              {screenShareParticipants.map((participant) => (
                <button
                  className={`flex min-w-44 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                    focusedScreenShareParticipant?.identity === participant.identity
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border bg-muted/30 text-muted-foreground hover:bg-accent"
                  }`}
                  key={`${participant.identity}-screen-share-chip`}
                  onClick={() => setFocusedScreenShareIdentity(participant.identity)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">
                      {getScreenShareLabel(participant)}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.1em] text-destructive">
                      Live screen
                    </span>
                  </span>
                  <ScreenShare className="size-4 shrink-0" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex min-h-[360px] flex-1 items-center justify-center overflow-hidden rounded-3xl border border-border bg-card p-2 shadow-inner shadow-black/20">
              {stageParticipant ? (
                <ParticipantTile
                  badge={stageMode === "screen" ? "LIVE" : undefined}
                  badgeTone="live"
                  className={`w-full ${
                    stageMode === "screen"
                      ? "h-full min-h-[360px]"
                      : participantCount === 1
                        ? "h-full max-h-[min(72vh,820px)] max-w-[min(100%,1120px)]"
                        : "h-full min-h-[360px]"
                  }`}
                  isFocused
                  key={`${stageParticipant.identity}-${stageMode}-stage`}
                  label={
                    stageMode === "screen"
                      ? getScreenShareLabel(stageParticipant)
                      : getParticipantLabel(stageParticipant)
                  }
                  mediaSource={
                    stageMode === "screen"
                      ? Track.Source.ScreenShare
                      : Track.Source.Camera
                  }
                  participant={stageParticipant}
                  showAudio={stageMode !== "screen"}
                  showMicStatus={stageMode !== "screen"}
                  variant="active"
                />
              ) : (
                <div className="flex min-h-[280px] items-center justify-center text-sm text-muted-foreground">
                  Waiting for local participant...
                </div>
              )}
            </div>

            {shouldShowThumbnails && thumbnailParticipants.length ? (
              <div className="grid max-h-40 shrink-0 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {thumbnailParticipants.map((participant) => (
                  <ParticipantTile
                    className="!min-h-[96px] border-border bg-muted/30"
                    isFocused={
                      stageMode === "camera" &&
                      focusedParticipant?.identity === participant.identity
                    }
                    key={`${participant.identity}-thumbnail`}
                    label={getParticipantLabel(participant)}
                    onClick={() => {
                      setFocusedScreenShareIdentity(null);
                      setFocusedParticipantIdentity(participant.identity);
                    }}
                    participant={participant}
                    variant="compact"
                  />
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-center gap-3 rounded-2xl border border-border bg-muted/30 p-3">
            <button
              className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                localParticipant?.isMicrophoneEnabled
                  ? "bg-muted text-foreground hover:bg-accent"
                  : "bg-destructive/20 text-destructive hover:bg-destructive/30"
              }`}
              disabled={!localParticipant || Boolean(pendingMediaToggle)}
              onClick={() => void toggleMicrophone()}
              title={
                localParticipant?.isMicrophoneEnabled
                  ? "Mute microphone"
                  : "Unmute microphone"
              }
              type="button"
            >
              {localParticipant?.isMicrophoneEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </button>
            <button
              className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                localParticipant?.isCameraEnabled
                  ? "bg-muted text-foreground hover:bg-accent"
                  : "bg-destructive/20 text-destructive hover:bg-destructive/30"
              }`}
              disabled={!localParticipant || Boolean(pendingMediaToggle)}
              onClick={() => void toggleCamera()}
              title={
                localParticipant?.isCameraEnabled
                  ? "Turn camera off"
                  : "Turn camera on"
              }
              type="button"
            >
              {localParticipant?.isCameraEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </button>
            <button
              className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl transition focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                isScreenSharing
                  ? "bg-primary/20 text-primary hover:bg-primary/30"
                  : "bg-muted text-foreground hover:bg-accent"
              }`}
              disabled={!localParticipant || Boolean(pendingMediaToggle)}
              onClick={() => void toggleScreenShare()}
              title={isScreenSharing ? "Stop screen sharing" : "Share screen"}
              type="button"
            >
              {isScreenSharing ? (
                <ScreenShareOff className="h-5 w-5" />
              ) : (
                <ScreenShare className="h-5 w-5" />
              )}
            </button>
            <RecordingControls
              autoStart={autoRecord}
              meetingId={meetingId}
              onStatusChange={setRecordingStatus}
              participantNames={participants.map((participant) => participant.displayName)}
              roomName={livekitRoomName}
            />
            <button
              className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl bg-destructive px-5 text-sm font-semibold text-white shadow-lg shadow-destructive/30 transition hover:bg-destructive/90 focus-visible:ring-2 focus-visible:ring-destructive/40"
              onClick={() => void handleLeave()}
              type="button"
            >
              <PhoneOff className="h-5 w-5" />
              Leave
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
