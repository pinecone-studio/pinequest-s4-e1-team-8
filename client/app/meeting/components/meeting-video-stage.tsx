"use client";

import { Track, type Participant } from "livekit-client";
import {
  Mic,
  MicOff,
  PhoneOff,
  ScreenShare,
  ScreenShareOff,
  Video,
  VideoOff,
} from "lucide-react";
import { ParticipantTile } from "./participant-tile";
import type { RecordingStatus } from "./recording-controls";

type MeetingVideoStageProps = {
  isCameraEnabled: boolean;
  isMicrophoneEnabled: boolean;
  isScreenSharing: boolean;
  localDisplayName: string;
  mediaSource: Track.Source.Camera | Track.Source.ScreenShare;
  onLeave: () => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleScreenShare: () => void;
  pendingMediaToggle: "camera" | "microphone" | "screen" | null;
  recordingStatus: RecordingStatus;
  stageLabel: string;
  stageParticipant: Participant | null;
};

const hudButtonClass =
  "flex size-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white backdrop-blur-md transition-all duration-200 hover:bg-black/40 disabled:cursor-not-allowed disabled:opacity-50";

const hudButtonOffClass =
  "flex size-12 shrink-0 items-center justify-center rounded-full border border-transparent bg-red-500/90 text-white backdrop-blur-md transition-all duration-200 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50";

export const MeetingVideoStage = ({
  isCameraEnabled,
  isMicrophoneEnabled,
  isScreenSharing,
  localDisplayName,
  mediaSource,
  onLeave,
  onToggleCamera,
  onToggleMicrophone,
  onToggleScreenShare,
  pendingMediaToggle,
  recordingStatus,
  stageLabel,
  stageParticipant,
}: MeetingVideoStageProps) => {
  const localInitial = (localDisplayName || "U").slice(0, 1).toUpperCase();

  return (
    <div className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-900">
      {stageParticipant ? (
        <ParticipantTile
          className="absolute inset-0 size-full rounded-none border-0 shadow-none"
          isFocused
          key={`${stageParticipant.identity}-${mediaSource}-stage`}
          label={stageLabel}
          mediaSource={mediaSource}
          participant={stageParticipant}
          showAudio={mediaSource !== Track.Source.ScreenShare}
          showMicStatus={false}
          variant="active"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">
          Waiting for video...
        </div>
      )}

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md transition-all duration-200">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          {localInitial}
        </span>
        You
      </div>

      {recordingStatus === "active" ? (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-all duration-200">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          Recording in Progress...
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center gap-3">
        <button
          aria-label={isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"}
          className={isMicrophoneEnabled ? hudButtonClass : hudButtonOffClass}
          disabled={Boolean(pendingMediaToggle)}
          onClick={onToggleMicrophone}
          type="button"
        >
          {isMicrophoneEnabled ? (
            <Mic className="size-5" />
          ) : (
            <MicOff className="size-5" />
          )}
        </button>
        <button
          aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}
          className={isCameraEnabled ? hudButtonClass : hudButtonOffClass}
          disabled={Boolean(pendingMediaToggle)}
          onClick={onToggleCamera}
          type="button"
        >
          {isCameraEnabled ? (
            <Video className="size-5" />
          ) : (
            <VideoOff className="size-5" />
          )}
        </button>
        <button
          aria-label={isScreenSharing ? "Stop screen sharing" : "Share screen"}
          className={hudButtonClass}
          disabled={Boolean(pendingMediaToggle)}
          onClick={onToggleScreenShare}
          type="button"
        >
          {isScreenSharing ? (
            <ScreenShareOff className="size-5" />
          ) : (
            <ScreenShare className="size-5" />
          )}
        </button>
        <button
          aria-label="End call"
          className="flex h-12 w-16 shrink-0 items-center justify-center rounded-3xl bg-red-500 text-white transition-all duration-200 hover:bg-red-600"
          onClick={onLeave}
          type="button"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>
    </div>
  );
};
