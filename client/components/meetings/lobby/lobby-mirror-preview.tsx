"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  EllipsisVertical,
  FlipHorizontal2,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from "lucide-react";
import type { RefObject } from "react";
import type { BackgroundEffect } from "./use-media-preview";

const AUDIO_LEVEL_ACTIVE_THRESHOLD = 0.15;
const BACKGROUND_BLUR_FILTER = "blur(24px)";

type LobbyMirrorPreviewProps = {
  audioLevel: number;
  avatarUrl?: string;
  backgroundEffect: BackgroundEffect;
  cameraError: string | null;
  displayName: string;
  isCamActive: boolean;
  isMicActive: boolean;
  isMirrored: boolean;
  microphoneError: string | null;
  onSetBackgroundEffect: (effect: BackgroundEffect) => void;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleMirror: () => void;
  videoRef: RefObject<HTMLVideoElement | null>;
};

const hudButtonClass = (isActive: boolean, isHighlighted?: boolean) =>
  cn(
    "flex size-12 items-center justify-center rounded-full transition-colors",
    !isActive && "bg-red-500 text-white hover:bg-red-600",
    isActive && !isHighlighted && "bg-white text-zinc-700 hover:bg-zinc-100",
    isActive &&
      isHighlighted &&
      "bg-primary text-primary-foreground hover:bg-primary/90",
  );

export function LobbyMirrorPreview({
  audioLevel,
  avatarUrl,
  backgroundEffect,
  cameraError,
  displayName,
  isCamActive,
  isMicActive,
  isMirrored,
  microphoneError,
  onSetBackgroundEffect,
  onToggleCamera,
  onToggleMicrophone,
  onToggleMirror,
  videoRef,
}: LobbyMirrorPreviewProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const statusMessage = cameraError ?? microphoneError;
  const isMicLevelActive =
    isMicActive && audioLevel >= AUDIO_LEVEL_ACTIVE_THRESHOLD;
  const isBackgroundBlurred = backgroundEffect === "blur";

  return (
    <div className="dark relative aspect-video w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-sm flex flex-col items-center justify-center">
      <video
        autoPlay
        className={cn(
          "h-full w-full bg-card object-cover transition-opacity duration-200",
          isCamActive ? "opacity-100" : "opacity-0",
        )}
        muted
        playsInline
        ref={videoRef}
        style={{
          filter: isBackgroundBlurred ? BACKGROUND_BLUR_FILTER : undefined,
          transform: isMirrored ? "scaleX(-1)" : undefined,
        }}
      />

      {!isCamActive ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card">
          <Avatar className="size-24" size="lg">
            <AvatarImage alt={displayName} src={avatarUrl} />
            <AvatarFallback className="bg-elevated text-2xl text-muted-foreground">
              {initial}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium text-muted-foreground">
            Camera is turned off
          </p>
        </div>
      ) : null}

      <p className="absolute top-3 left-4 text-sm font-medium text-white drop-shadow-sm">
        {displayName || "You"}
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="More options"
          className="absolute top-2 right-2 flex size-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          type="button"
        >
          <EllipsisVertical className="size-[18px]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom">
          <DropdownMenuCheckboxItem
            checked={isMirrored}
            onCheckedChange={onToggleMirror}
          >
            <FlipHorizontal2 className="size-4" />
            Mirror my video
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {statusMessage ? (
        <div className="absolute inset-x-6 top-12 rounded-lg bg-red-500/10 px-3 py-2 text-center text-xs font-medium text-red-300 ring-1 ring-red-500/20">
          {statusMessage}
        </div>
      ) : null}

      <div className="absolute inset-x-0 bottom-6 flex items-center justify-center">
        <div className="flex items-center gap-3 rounded-full bg-card/50 px-3 py-2 ring-1 ring-white/10 backdrop-blur-md">
          <button
            aria-label={isMicActive ? "Mute microphone" : "Unmute microphone"}
            aria-pressed={!isMicActive}
            className={cn(
              hudButtonClass(isMicActive),
              isMicLevelActive && "ring-2 ring-emerald-400/80",
            )}
            onClick={onToggleMicrophone}
            type="button"
          >
            {isMicActive ? (
              <Mic className="size-[18px]" />
            ) : (
              <MicOff className="size-[18px]" />
            )}
          </button>

          <button
            aria-label={isCamActive ? "Turn camera off" : "Turn camera on"}
            aria-pressed={!isCamActive}
            className={hudButtonClass(isCamActive)}
            onClick={onToggleCamera}
            type="button"
          >
            {isCamActive ? (
              <Video className="size-[18px]" />
            ) : (
              <VideoOff className="size-[18px]" />
            )}
          </button>

          {/* <button
            aria-label={
              isBackgroundBlurred
                ? "Turn off background blur"
                : "Turn on background blur"
            }
            aria-pressed={isBackgroundBlurred}
            className={hudButtonClass(true, isBackgroundBlurred)}
            onClick={() =>
              onSetBackgroundEffect(isBackgroundBlurred ? "none" : "blur")
            }
            type="button"
          >
            <Grid3x3 className="size-[18px]" />
          </button> */}
        </div>
      </div>

      {/* <div
        className={cn(
          "absolute bottom-4 left-4 flex size-10 items-center justify-center rounded-full transition-colors",
          isMicLevelActive
            ? "bg-primary/25 text-primary"
            : "bg-primary/10 text-primary/70",
        )}
      >
        <AudioLines className="size-[18px]" />
      </div> */}
    </div>
  );
}
