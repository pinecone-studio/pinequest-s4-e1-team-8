"use client";

import { Track, type RemoteParticipant } from "livekit-client";
import { memo, useEffect, useRef } from "react";

type ParticipantAudioProps = {
  participant: RemoteParticipant;
  version: number;
};

export const ParticipantAudio = memo(function ParticipantAudio({
  participant,
  version,
}: ParticipantAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const publication = participant.getTrackPublication(Track.Source.Microphone);
    const track = publication?.track;
    const element = audioRef.current;

    if (!track || !element) return;

    track.attach(element);

    return () => {
      track.detach(element);
    };
  }, [participant, version]);

  return <audio autoPlay ref={audioRef} />;
});
