"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AudioLines, Mic, MicOff, Video, VideoOff } from "lucide-react";
import type { RefObject } from "react";

const AUDIO_LEVEL_BARS = 5;

type LobbyMirrorPreviewProps = {
  audioLevel: number;
  avatarUrl?: string;
  cameraError: string | null;
  displayName: string;
  isCamActive: boolean;
  isMicActive: boolean;
  microphoneError: string | null;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
};

export function LobbyMirrorPreview({
  audioLevel,
  avatarUrl,
  cameraError,
  displayName,
  isCamActive,
  isMicActive,
  microphoneError,
  onToggleCamera,
  onToggleMicrophone,
  videoRef,
}: LobbyMirrorPreviewProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const statusMessage = cameraError ?? microphoneError;

  return (
    <div className="relative aspect-video w-full flex-1 max-w-xl overflow-hidden rounded-[24px] border border-zinc-100 bg-zinc-950 shadow-sm">
      <div className="absolute inset-0" style={{ transform: "scaleX(-1)" }}>
        <video
          autoPlay
          className={cn(
            "h-full w-full bg-zinc-900 object-cover transition-opacity duration-200",
            isCamActive ? "opacity-100" : "opacity-0",
          )}
          muted
          playsInline
          ref={videoRef}
        />
      </div>

      {!isCamActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
          <Avatar className="size-20" size="lg">
            <AvatarImage alt={displayName} src={avatarUrl} />
            <AvatarFallback className="bg-zinc-800 text-2xl text-zinc-300">
              {initial}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium text-zinc-400">Camera is turned off</p>
        </div>
      ) : null}

      {statusMessage ? (
        <div className="absolute inset-x-6 top-6 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-300 ring-1 ring-red-500/20">
          {statusMessage}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-zinc-900/80 px-4 py-2.5 shadow-lg ring-1 ring-white/10 backdrop-blur">
          <button
            aria-label={isMicActive ? "Mute microphone" : "Unmute microphone"}
            aria-pressed={!isMicActive}
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-all duration-200",
              isMicActive
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-red-500 text-white hover:bg-red-600",
            )}
            onClick={onToggleMicrophone}
            type="button"
          >
            {isMicActive ? <Mic className="size-[18px]" /> : <MicOff className="size-[18px]" />}
          </button>

          <button
            aria-label={isCamActive ? "Turn camera off" : "Turn camera on"}
            aria-pressed={!isCamActive}
            className={cn(
              "flex size-10 items-center justify-center rounded-full transition-all duration-200",
              isCamActive
                ? "bg-white/10 text-white hover:bg-white/20"
                : "bg-red-500 text-white hover:bg-red-600",
            )}
            onClick={onToggleCamera}
            type="button"
          >
            {isCamActive ? <Video className="size-[18px]" /> : <VideoOff className="size-[18px]" />}
          </button>

          <div
            aria-hidden
            className="flex h-10 items-center gap-1 rounded-full bg-white/5 px-3"
          >
            <AudioLines className="size-4 text-zinc-400" />
            <div className="flex h-4 items-end gap-0.5">
              {Array.from({ length: AUDIO_LEVEL_BARS }, (_, index) => {
                const threshold = (index + 1) / AUDIO_LEVEL_BARS;
                const isLit = isMicActive && audioLevel >= threshold * 0.85;

                return (
                  <span
                    key={index}
                    className={cn(
                      "w-0.5 rounded-full transition-all duration-200",
                      isLit ? "bg-emerald-400" : "bg-zinc-600",
                    )}
                    style={{ height: `${4 + index * 2}px` }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
