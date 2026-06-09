"use client";

import {
  ParticipantEvent,
  Track,
  type Participant,
  type RemoteParticipant,
} from "livekit-client";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useParticipantTrackVersion } from "../hooks/use-participant-version";
import { ParticipantAudio } from "./participant-audio";
import { ParticipantVideo } from "./participant-video";

type ParticipantTileProps = {
  badge?: string;
  badgeTone?: "default" | "live";
  className?: string;
  isFocused?: boolean;
  label?: string;
  mediaSource?: Track.Source.Camera | Track.Source.ScreenShare;
  onClick?: () => void;
  participant: Participant;
  showAudio?: boolean;
  showMicStatus?: boolean;
  variant?: "active" | "compact";
};

export const getParticipantDisplayName = (
  participant: Pick<Participant, "identity" | "name">,
  fallback?: string,
) => {
  const name = participant.name || participant.identity || fallback || "User";

  return name.split("__")[0] || name;
};

export const ParticipantTile = ({
  badge,
  badgeTone = "default",
  className,
  isFocused = false,
  label,
  mediaSource = Track.Source.Camera,
  onClick,
  participant,
  showAudio = true,
  showMicStatus = true,
  variant = "compact",
}: ParticipantTileProps) => {
  const [isSpeaking, setIsSpeaking] = useState(participant.isSpeaking);
  const audioVersion = useParticipantTrackVersion(
    participant,
    Track.Source.Microphone,
  );
  const videoVersion = useParticipantTrackVersion(participant, mediaSource);
  const displayName = label ?? getParticipantDisplayName(participant);
  const isActive = variant === "active";
  const isScreenShare = mediaSource === Track.Source.ScreenShare;
  const hasVideo = isScreenShare
    ? participant.isScreenShareEnabled
    : participant.isCameraEnabled;
  const isActivelySpeaking =
    !isScreenShare && participant.isMicrophoneEnabled && isSpeaking;

  useEffect(() => {
    const syncSpeaking = (speaking: boolean) => {
      setIsSpeaking(speaking);
    };

    setIsSpeaking(participant.isSpeaking);
    participant.on(ParticipantEvent.IsSpeakingChanged, syncSpeaking);

    return () => {
      participant.off(ParticipantEvent.IsSpeakingChanged, syncSpeaking);
    };
  }, [participant]);

  return (
    <article
      aria-pressed={onClick ? isFocused : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-[box-shadow,border-color]",
        onClick &&
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40",
        isFocused && "border-violet-400/40 ring-1 ring-violet-400/30",
        isActive ? "min-h-[360px]" : "aspect-video min-h-[150px]",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-muted/40 ring-1 ring-inset ring-transparent transition-[box-shadow]",
          !isScreenShare &&
            hasVideo &&
            isActivelySpeaking &&
            "shadow-[inset_0_0_0_1px_rgba(167,139,250,0.58),0_0_28px_rgba(124,58,237,0.22)]",
        )}
      >
        {hasVideo ? (
          <ParticipantVideo
            participant={participant}
            source={mediaSource}
            version={videoVersion}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-5 text-center">
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/15 font-semibold text-violet-900 dark:text-violet-100 ring-1 ring-violet-400/20 transition-[box-shadow]",
                isActivelySpeaking &&
                  "shadow-[0_0_0_2px_rgba(167,139,250,0.58),0_0_24px_rgba(124,58,237,0.3)]",
                isActive
                  ? "size-24 text-3xl"
                  : "size-14 text-xl",
              )}
            >
              {(displayName ?? "U").slice(0, 1).toUpperCase()}
            </div>
            <p
              className={cn(
                "max-w-full truncate font-medium text-foreground",
                isActive ? "text-base" : "text-sm",
              )}
            >
              {displayName}
            </p>
          </div>
        )}
      </div>
      {isActivelySpeaking ? (
        <span className="absolute right-3 top-3 rounded-full border border-violet-300/30 bg-violet-100 dark:bg-violet-500/15 px-2.5 py-1 text-[11px] font-medium text-violet-900 dark:text-violet-100 backdrop-blur">
          Speaking
        </span>
      ) : null}
      {badge ? (
        <span
          className={cn(
            "absolute left-3 top-3 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur",
            badgeTone === "live"
              ? "border-red-300/30 bg-red-500/80 text-white"
              : "border-violet-300/30 bg-violet-100 dark:bg-violet-500/15 text-violet-900 dark:text-violet-100",
          )}
        >
          {badge}
        </span>
      ) : null}
      <div
        className={cn(
          "absolute inset-x-3 bottom-3 flex items-center gap-2",
          hasVideo ? "justify-between" : "justify-end",
        )}
      >
        {hasVideo ? (
          <span className="max-w-[70%] truncate rounded-full bg-background/70 px-3 py-1 text-sm font-medium text-foreground backdrop-blur">
            {displayName}
          </span>
        ) : null}
        {showMicStatus ? (
          <span
            className={`w-20 shrink-0 rounded-full px-3 py-1 text-center text-xs font-medium backdrop-blur ${
              participant.isMicrophoneEnabled
                ? "bg-violet-400/15 text-violet-900 dark:text-violet-100"
                : "bg-red-400/15 text-red-800 dark:text-red-100"
            }`}
          >
            {participant.isMicrophoneEnabled ? "Mic on" : "Muted"}
          </span>
        ) : null}
      </div>
      {showAudio && !participant.isLocal ? (
        <ParticipantAudio
          participant={participant as RemoteParticipant}
          version={audioVersion}
        />
      ) : null}
    </article>
  );
};
