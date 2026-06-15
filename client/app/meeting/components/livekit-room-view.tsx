"use client";

import {
  ConnectionState,
  ParticipantEvent,
  Track,
  type Participant,
} from "livekit-client";
import { useEffect, useMemo, useState } from "react";
import { useMediaToggleShortcuts } from "@/hooks/use-media-toggle-shortcuts";
import { useLatestMeetingSummary } from "../hooks/use-latest-meeting-summary";
import { useMeetingTasks } from "../hooks/use-meeting-tasks";
import type { TranscriptLanguage } from "../utils/transcript-language";
import { MeetingParticipantFilmstrip } from "./meeting-participant-filmstrip";
import { MeetingRoomChatPanel } from "./meeting-room-chat-panel";
import { MeetingRoomHeader } from "./meeting-room-header";
import { useMeetingSession } from "./meeting-session-provider";
import { MeetingSummarySidebarCard } from "./meeting-summary-sidebar-card";
import { MeetingTasksCard } from "./meeting-tasks-card";
import { MeetingVideoStage } from "./meeting-video-stage";
import { getParticipantDisplayName } from "./participant-tile";
import { RecordingControls, type RecordingStatus } from "./recording-controls";

type LivekitRoomViewProps = {
  autoRecord?: boolean;
  livekitRoomName: string;
  meetingId: string;
  onLeave: () => void;
  roomName: string;
  transcriptLanguage?: TranscriptLanguage;
};

export const LivekitRoomView = ({
  autoRecord,
  livekitRoomName,
  meetingId,
  onLeave,
  roomName,
  transcriptLanguage = "en",
}: LivekitRoomViewProps) => {
  const {
    activeSessionHref,
    connectionState,
    error,
    leaveActiveSession,
    localParticipant,
    participants,
    remoteParticipants,
    room,
  } = useMeetingSession();
  const isConnecting = connectionState === ConnectionState.Connecting;
  const allParticipants = useMemo(
    () => [...(localParticipant ? [localParticipant] : []), ...remoteParticipants],
    [localParticipant, remoteParticipants],
  );
  const screenShareParticipants = useMemo(
    () => allParticipants.filter((participant) => participant.isScreenShareEnabled),
    [allParticipants],
  );
  const [focusedParticipantIdentity, setFocusedParticipantIdentity] = useState<
    string | null
  >(null);
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatus>("not-started");
  const { isLoading: isSummaryLoading, transcript } = useLatestMeetingSummary();
  const { addTask, tasks, toggleTask } = useMeetingTasks({ connectionState, room });

  const focusedParticipant =
    allParticipants.find(
      (participant) => participant.identity === focusedParticipantIdentity,
    ) ??
    remoteParticipants[0] ??
    localParticipant ??
    null;
  const stageScreenShareParticipant = screenShareParticipants[0] ?? null;
  const stageMode = stageScreenShareParticipant ? "screen" : "camera";
  const stageParticipant = stageScreenShareParticipant ?? focusedParticipant;
  const mediaSource =
    stageMode === "screen" ? Track.Source.ScreenShare : Track.Source.Camera;
  const filmstripParticipants =
    stageMode === "screen"
      ? allParticipants
      : allParticipants.filter(
          (participant) => participant.identity !== stageParticipant?.identity,
        );
  const focusedFilmstripIdentity =
    stageMode === "camera" ? stageParticipant?.identity ?? null : null;

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

  useMediaToggleShortcuts({
    onToggleCamera: () => void toggleCamera(),
    onToggleMicrophone: () => void toggleMicrophone(),
  });

  const toggleScreenShare = async () => {
    if (!room || !localParticipant || pendingMediaToggle) return;

    setPendingMediaToggle("screen");
    try {
      await room.localParticipant.setScreenShareEnabled(
        !localParticipant.isScreenShareEnabled,
      );
      setLocalVersion((v) => v + 1);
    } catch (caughtError) {
      console.warn("[meeting] Screen share toggle failed", caughtError);
      setLocalVersion((v) => v + 1);
    } finally {
      setPendingMediaToggle(null);
    }
  };

  const getScreenShareLabel = (participant: Participant) =>
    participant.isLocal
      ? "Your screen"
      : `${getParticipantDisplayName(participant)}'s screen`;

  const getParticipantLabel = (participant: Participant) =>
    participant.isLocal ? "You" : getParticipantDisplayName(participant);

  const stageLabel = stageParticipant
    ? stageMode === "screen"
      ? getScreenShareLabel(stageParticipant)
      : getParticipantLabel(stageParticipant)
    : "";

  return (
    <section
      className="flex size-full flex-col gap-4 rounded-[32px] bg-white p-6 shadow-xl"
      data-transcript-language={transcriptLanguage}
    >
      <MeetingRoomHeader
        meetingId={meetingId}
        meetingLinkPath={activeSessionHref}
        room={room}
        roomName={roomName}
      />

      <RecordingControls
        autoStart={autoRecord}
        meetingId={meetingId}
        onStatusChange={setRecordingStatus}
        participantNames={participants.map((participant) => participant.displayName)}
        roomName={livekitRoomName}
      />

      {isConnecting ? (
        <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-500">
          Connecting...
        </p>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-h-0 flex-1 flex-col">
          <MeetingVideoStage
            isCameraEnabled={Boolean(localParticipant?.isCameraEnabled)}
            isMicrophoneEnabled={Boolean(localParticipant?.isMicrophoneEnabled)}
            isScreenSharing={Boolean(localParticipant?.isScreenShareEnabled)}
            localDisplayName={
              localParticipant ? getParticipantDisplayName(localParticipant) : "You"
            }
            mediaSource={mediaSource}
            onLeave={() => void handleLeave()}
            onToggleCamera={() => void toggleCamera()}
            onToggleMicrophone={() => void toggleMicrophone()}
            onToggleScreenShare={() => void toggleScreenShare()}
            pendingMediaToggle={pendingMediaToggle}
            recordingStatus={recordingStatus}
            stageLabel={stageLabel}
            stageParticipant={stageParticipant}
          />
          <MeetingParticipantFilmstrip
            focusedIdentity={focusedFilmstripIdentity}
            getParticipantLabel={getParticipantLabel}
            onSelectParticipant={(identity) => setFocusedParticipantIdentity(identity)}
            participants={filmstripParticipants}
          />
        </div>

        <aside className="flex min-h-0 w-[360px] shrink-0 flex-col gap-4">
          <MeetingSummarySidebarCard isLoading={isSummaryLoading} summary={transcript?.summary} />
          <MeetingTasksCard
            onAddTask={(input) => void addTask(input)}
            onToggleTask={(id) => void toggleTask(id)}
            participants={participants}
            tasks={tasks}
          />
          <MeetingRoomChatPanel
            connectionState={connectionState}
            participants={participants}
            room={room}
          />
        </aside>
      </div>
    </section>
  );
};
