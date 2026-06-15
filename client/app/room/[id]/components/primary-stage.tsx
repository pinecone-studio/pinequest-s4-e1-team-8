import { cn } from "@/lib/utils";
import {
  Mic,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  Power,
  ScreenShare,
  ScreenShareOff,
  Settings2,
  Square,
  Video,
  VideoOff,
} from "lucide-react";
import type { CallParticipant, CaptionLine, RecordingState } from "../types";
import { CallControlButton } from "./call-control-button";

type PrimaryStageProps = {
  activeParticipant: CallParticipant;
  captionLine: CaptionLine;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  onEndCall: () => void;
  onStopRecording: () => void;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onToggleRecordingPause: () => void;
  onToggleScreenShare: () => void;
  recordingState: RecordingState;
};

const WAVEFORM_BAR_HEIGHTS = ["h-2", "h-4", "h-5", "h-3", "h-6", "h-3", "h-4"];

export const PrimaryStage = ({
  activeParticipant,
  captionLine,
  isCameraOn,
  isMicOn,
  isScreenSharing,
  onEndCall,
  onStopRecording,
  onToggleCamera,
  onToggleMic,
  onToggleRecordingPause,
  onToggleScreenShare,
  recordingState,
}: PrimaryStageProps) => {
  return (
    <div className="relative flex-1 overflow-hidden rounded-[24px] bg-zinc-900">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={cn(
            "flex size-32 items-center justify-center rounded-full bg-gradient-to-br text-5xl font-semibold text-white shadow-2xl",
            activeParticipant.avatarGradient,
          )}
        >
          {activeParticipant.initial}
        </div>
      </div>

      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-sm font-medium text-white backdrop-blur-md">
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-bold text-white",
            activeParticipant.avatarGradient,
          )}
        >
          {activeParticipant.initial}
        </span>
        {activeParticipant.isSelf ? "You" : activeParticipant.name}
      </div>

      {recordingState !== "stopped" ? (
        <div className="absolute right-4 top-4 flex items-center gap-3 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
          {recordingState === "recording" ? (
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-red-500" />
            </span>
          ) : (
            <span className="size-2 rounded-full bg-amber-400" />
          )}
          <span>
            {recordingState === "recording"
              ? "Recording in Progress..."
              : "Recording paused"}
          </span>
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-2.5">
            <button
              aria-label={
                recordingState === "recording"
                  ? "Pause recording"
                  : "Resume recording"
              }
              className="flex size-6 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={onToggleRecordingPause}
              type="button"
            >
              {recordingState === "recording" ? (
                <Pause className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
            </button>
            <button
              aria-label="Stop recording"
              className="flex size-6 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={onStopRecording}
              type="button"
            >
              <Square className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="absolute bottom-[104px] left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-black/30 p-2 backdrop-blur-md">
        <CallControlButton
          active={isMicOn}
          icon={isMicOn ? Mic : MicOff}
          label={isMicOn ? "Mute microphone" : "Unmute microphone"}
          onClick={onToggleMic}
        />
        <CallControlButton
          active={isCameraOn}
          icon={isCameraOn ? Video : VideoOff}
          label={isCameraOn ? "Turn camera off" : "Turn camera on"}
          onClick={onToggleCamera}
        />
        <CallControlButton
          active={!isScreenSharing}
          icon={isScreenSharing ? ScreenShareOff : ScreenShare}
          label={isScreenSharing ? "Stop screen share" : "Share screen"}
          onClick={onToggleScreenShare}
        />
        <button
          aria-label="End call"
          className="flex size-12 shrink-0 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          onClick={onEndCall}
          type="button"
        >
          <PhoneOff className="size-5" />
        </button>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-white backdrop-blur-md">
        <div className="flex h-6 shrink-0 items-end gap-0.5">
          {WAVEFORM_BAR_HEIGHTS.map((height, index) => (
            <span
              className={cn(
                "w-1 animate-pulse rounded-full bg-emerald-400",
                height,
              )}
              key={`waveform-bar-${index}`}
              style={{ animationDelay: `${index * 120}ms` }}
            />
          ))}
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold sm:text-base">
          {captionLine.text}
        </p>
        <div className="flex shrink-0 items-center gap-2 text-white/70">
          <button
            aria-label="Captions power"
            className="flex size-8 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white"
            type="button"
          >
            <Power className="size-4" />
          </button>
          <button
            aria-label="Caption settings"
            className="flex size-8 items-center justify-center rounded-full transition hover:bg-white/10 hover:text-white"
            type="button"
          >
            <Settings2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
