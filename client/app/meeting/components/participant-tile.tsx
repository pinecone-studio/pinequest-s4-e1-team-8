"use client";

import { type Participant, type RemoteParticipant } from "livekit-client";
import { useParticipantVersion } from "../hooks/use-participant-version";
import { ParticipantAudio } from "./participant-audio";
import { ParticipantVideo } from "./participant-video";

type ParticipantTileProps = {
  label?: string;
  participant: Participant;
  variant?: "active" | "compact";
};

export const ParticipantTile = ({
  label,
  participant,
  variant = "compact",
}: ParticipantTileProps) => {
  const version = useParticipantVersion(participant);
  const displayName = participant.name || participant.identity || label;
  const isActive = variant === "active";

  return (
    <article
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-[#1a1627] shadow-lg shadow-black/20 ${
        isActive ? "min-h-[360px]" : "min-h-[150px]"
      }`}
    >
      <div className={`${isActive ? "h-full min-h-[360px]" : "aspect-video"} bg-[#100e18]`}>
        {participant.isCameraEnabled ? (
          <ParticipantVideo participant={participant} version={version} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/20 text-2xl font-semibold text-violet-100">
              {(displayName ?? "G").slice(0, 1).toUpperCase()}
            </div>
          </div>
        )}
      </div>
      <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
        <span className="max-w-[70%] truncate rounded-full bg-black/45 px-3 py-1 text-sm font-medium text-white backdrop-blur">
          {displayName}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium backdrop-blur ${
            participant.isMicrophoneEnabled
              ? "bg-emerald-400/15 text-emerald-100"
              : "bg-red-400/15 text-red-100"
          }`}
        >
          {participant.isMicrophoneEnabled ? "Mic on" : "Muted"}
        </span>
      </div>
      {!participant.isLocal ? (
        <ParticipantAudio
          participant={participant as RemoteParticipant}
          version={version}
        />
      ) : null}
    </article>
  );
};
