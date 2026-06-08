"use client";

import { ConnectionState, ParticipantEvent, Track } from "livekit-client";
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
import { useMeetingChannelPresence } from "./meeting-channel-presence-provider";
import { useLivekitRoom } from "../hooks/use-livekit-room";
import {
  getParticipantDisplayName,
  ParticipantTile,
} from "./participant-tile";
import { RecordingControls } from "./recording-controls";

type LivekitRoomViewProps = {
  livekitUrl: string;
  livekitRoomName: string;
  meetingId: string;
  onLeave: () => void;
  roomName: string;
  token: string;
};

export const LivekitRoomView = ({
  livekitUrl,
  livekitRoomName,
  meetingId,
  onLeave,
  roomName,
  token,
}: LivekitRoomViewProps) => {
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
    remoteParticipants,
    room,
  } = useLivekitRoom({ livekitUrl, token });
  const isConnecting = connectionState === ConnectionState.Connecting;
  const isConnected = connectionState === ConnectionState.Connected;
  const participantCount = (localParticipant ? 1 : 0) + remoteParticipants.length;
  const remoteCompactParticipants = remoteParticipants.slice(0, 4);
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
  const screenShareParticipantKey = screenShareParticipants
    .map((participant) => participant.identity)
    .join("|");
  const focusedScreenShareParticipant =
    screenShareParticipants.find(
      (participant) => participant.identity === focusedScreenShareIdentity,
    ) ?? null;
  const isStreamFocused = Boolean(focusedScreenShareParticipant);
  const secondaryScreenShareParticipants = screenShareParticipants.filter(
    (participant) => participant.identity !== focusedScreenShareParticipant?.identity,
  );
  const connectionLabel = isConnecting
    ? "Connecting..."
    : isConnected
      ? "Connected"
      : connectionState === ConnectionState.Reconnecting
        ? "Reconnecting..."
        : "Disconnected";

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;

    setJoinedChannel({ meetingId, roomName });

    return () => {
      clearJoinedChannel();
    };
  }, [clearJoinedChannel, connectionState, meetingId, roomName, setJoinedChannel]);

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
    const participants = [
      ...(localParticipant ? [localParticipant] : []),
      ...remoteParticipants,
    ];

    setJoinedChannelParticipants(
      participants.map((participant) => ({
        displayName: participant.isLocal
          ? "You"
          : getParticipantDisplayName(participant),
        identity: participant.identity,
        isLocal: participant.isLocal,
        isScreenSharing: participant.isScreenShareEnabled,
      })),
    );
  }, [
    localParticipant,
    localScreenShareEnabled,
    remoteParticipants,
    setJoinedChannelParticipants,
  ]);

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
    await leaveRoom();
    clearJoinedChannel();
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

  return (
    <section
      className={`grid w-full flex-1 gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-sm ${
        isStreamFocused ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_340px]"
      }`}
    >
      <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <header className="flex shrink-0 flex-col gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-foreground">
              {roomName}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              {isConnected && (
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
              )}
              {connectionLabel}
            </p>
          </div>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">
              <Radio className="h-3.5 w-3.5" />
              Recording ready
            </span>
            <span className="max-w-full truncate rounded-full border border-border/60 bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
              ID {meetingId}
            </span>
          </div>
        </header>

        {isConnecting ? (
          <p className="rounded-xl border border-violet-300/20 bg-violet-500/10 p-3 text-sm text-violet-100">
            Connecting...
          </p>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {focusedScreenShareParticipant ? (
          <div className="grid min-h-0 flex-1 gap-2 xl:grid-cols-[minmax(0,1fr)_180px]">
            <div className="flex min-h-[420px] flex-col gap-2 sm:min-h-[560px] xl:min-h-[min(76vh,820px)]">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {getScreenShareLabel(focusedScreenShareParticipant)}
                  </p>
                  <p className="text-xs text-muted-foreground">Stream view</p>
                </div>
                <button
                  className="shrink-0 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary focus-visible:ring-2 focus-visible:ring-violet-500/40"
                  onClick={() => setFocusedScreenShareIdentity(null)}
                  type="button"
                >
                  Exit stream view
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <ParticipantTile
                  badge="LIVE"
                  badgeTone="live"
                  className="h-full"
                  isFocused
                  key={`${focusedScreenShareParticipant.identity}-screen-share-focused`}
                  label={getScreenShareLabel(focusedScreenShareParticipant)}
                  mediaSource={Track.Source.ScreenShare}
                  participant={focusedScreenShareParticipant}
                  showAudio={false}
                  showMicStatus={false}
                  variant="active"
                />
              </div>
            </div>

            <div className="grid min-h-0 gap-2 sm:grid-cols-2 xl:max-h-[min(76vh,820px)] xl:grid-cols-1 xl:content-start xl:overflow-y-auto xl:pr-1">
              {secondaryScreenShareParticipants.map((participant) => (
                <ParticipantTile
                  badge="LIVE"
                  badgeTone="live"
                  key={`${participant.identity}-screen-share-secondary`}
                  label={getScreenShareLabel(participant)}
                  mediaSource={Track.Source.ScreenShare}
                  onClick={() => setFocusedScreenShareIdentity(participant.identity)}
                  participant={participant}
                  showAudio={false}
                  showMicStatus={false}
                  className="xl:min-h-[105px]"
                />
              ))}
              {localParticipant ? (
                <ParticipantTile
                  className="xl:min-h-[105px]"
                  key={`${localParticipant.identity}-presenter-local`}
                  label="You"
                  participant={localParticipant}
                />
              ) : null}
              {remoteCompactParticipants.map((participant) => (
                <ParticipantTile
                  className="xl:min-h-[105px]"
                  key={`${participant.identity}-presenter-participant`}
                  participant={participant}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {screenShareParticipants.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {screenShareParticipants.map((participant) => (
                  <div
                    className="grid gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3 shadow-sm"
                    key={`${participant.identity}-screen-share-preview`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {getScreenShareLabel(participant)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Screen share is live
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">
                        LIVE
                      </span>
                    </div>
                    <div className="h-[180px] overflow-hidden rounded-xl sm:h-[220px]">
                      <ParticipantTile
                        badge="LIVE"
                        badgeTone="live"
                        className="h-full !min-h-0"
                        label={getScreenShareLabel(participant)}
                        mediaSource={Track.Source.ScreenShare}
                        participant={participant}
                        showAudio={false}
                        showMicStatus={false}
                      />
                    </div>
                    <button
                      className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/40"
                      onClick={() =>
                        setFocusedScreenShareIdentity(participant.identity)
                      }
                      type="button"
                    >
                      Watch Stream
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {remoteCompactParticipants.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {remoteCompactParticipants.map((participant) => (
                  <ParticipantTile
                    key={participant.identity}
                    participant={participant}
                  />
                ))}
              </div>
            ) : null}
          </>
        )}

        {!focusedScreenShareParticipant ? (
          <div className="min-h-0 flex-1">
            {localParticipant ? (
              <ParticipantTile
                label="You"
                participant={localParticipant}
                variant="active"
              />
            ) : (
              <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-border/60 bg-muted/30 text-sm text-muted-foreground">
                Waiting for local participant...
              </div>
            )}
          </div>
        ) : null}

        <div className="flex shrink-0 items-center justify-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
          <button
            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl transition focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
              localParticipant?.isMicrophoneEnabled
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-red-500/20 text-red-100 hover:bg-red-500/30"
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
            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl transition focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
              localParticipant?.isCameraEnabled
                ? "bg-secondary text-foreground hover:bg-secondary/80"
                : "bg-red-500/20 text-red-100 hover:bg-red-500/30"
            }`}
            disabled={!localParticipant || Boolean(pendingMediaToggle)}
            onClick={() => void toggleCamera()}
            title={
              localParticipant?.isCameraEnabled ? "Turn camera off" : "Turn camera on"
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
            className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl transition focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-50 ${
              isScreenSharing
                ? "bg-violet-500/25 text-violet-100 hover:bg-violet-500/35"
                : "bg-secondary text-foreground hover:bg-secondary/80"
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
          <button
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-semibold text-white shadow-lg shadow-red-950/30 transition hover:bg-red-400 focus-visible:ring-2 focus-visible:ring-red-400/40"
            onClick={() => void handleLeave()}
            type="button"
          >
            <PhoneOff className="h-5 w-5" />
            Leave
          </button>
        </div>
      </div>

      <aside
        className={`min-h-0 flex-col gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 ${
          isStreamFocused ? "hidden" : "flex"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-violet-400" />
              Participants
            </h3>
            <span className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground">
              {participantCount}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {localParticipant ? (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 text-sm text-foreground">
                <span className="min-w-0 truncate">You</span>
                <span className="shrink-0 text-xs text-violet-300">Host</span>
              </div>
            ) : null}
            {remoteParticipants.map((participant) => (
              <div
                className="flex items-center justify-between gap-3 rounded-xl bg-background px-3 py-2 text-sm text-foreground"
                key={participant.identity}
              >
                <span className="min-w-0 truncate">
                  {getParticipantDisplayName(participant)}
                </span>
                <span className="w-14 shrink-0 text-right text-xs text-muted-foreground">
                  {participant.isMicrophoneEnabled ? "Mic on" : "Muted"}
                </span>
              </div>
            ))}
            {!participantCount ? (
              <p className="text-sm text-muted-foreground">No participants yet.</p>
            ) : null}
          </div>
        </div>

        <RecordingControls meetingId={meetingId} roomName={livekitRoomName} />
      </aside>
    </section>
  );
};
