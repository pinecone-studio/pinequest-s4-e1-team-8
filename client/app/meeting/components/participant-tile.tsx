"use client";

import { type Participant, type RemoteParticipant } from "livekit-client";
import { useParticipantVersion } from "../hooks/use-participant-version";
import { ParticipantAudio } from "./participant-audio";
import { ParticipantVideo } from "./participant-video";

type ParticipantTileProps = {
  label?: string;
  participant: Participant;
};

export const ParticipantTile = ({ label, participant }: ParticipantTileProps) => {
  const version = useParticipantVersion(participant);
  const displayName = participant.name || participant.identity || label;

  return (
    <article className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-950">
      <div className="aspect-video bg-zinc-900">
        {participant.isCameraEnabled ? (
          <ParticipantVideo participant={participant} version={version} />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-300">
            Camera off
          </div>
        )}
      </div>
      <div className="flex items-center justify-between bg-white px-3 py-2 text-sm">
        <span className="font-medium text-zinc-900">{displayName}</span>
        <span className="text-xs text-zinc-500">
          {participant.isMicrophoneEnabled ? "Mic on" : "Mic off"}
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
