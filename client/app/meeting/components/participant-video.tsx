"use client";

import { Track, type Participant } from "livekit-client";
import { useEffect, useRef } from "react";

type ParticipantVideoProps = {
  participant: Participant;
  version: number;
};

export const ParticipantVideo = ({
  participant,
  version,
}: ParticipantVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const publication = participant.getTrackPublication(Track.Source.Camera);
    const track = publication?.track;
    const element = videoRef.current;

    if (!track || !element) return;

    track.attach(element);

    return () => {
      track.detach(element);
    };
  }, [participant, version]);

  return (
    <video
      autoPlay
      className="h-full w-full object-cover"
      muted={participant.isLocal}
      playsInline
      ref={videoRef}
    />
  );
};
