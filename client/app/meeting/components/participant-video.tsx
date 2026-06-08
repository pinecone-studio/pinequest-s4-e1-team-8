"use client";

import { Track, type Participant } from "livekit-client";
import { memo, useEffect, useRef } from "react";

type ParticipantVideoProps = {
  participant: Participant;
  source?: Track.Source.Camera | Track.Source.ScreenShare;
  version: number;
};

export const ParticipantVideo = memo(function ParticipantVideo({
  participant,
  source = Track.Source.Camera,
  version,
}: ParticipantVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const publication = participant.getTrackPublication(source);
    const track = publication?.track;
    const element = videoRef.current;

    if (!track || !element) return;

    track.attach(element);

    return () => {
      track.detach(element);
    };
  }, [participant, source, version]);

  return (
    <video
      autoPlay
      className={`h-full w-full ${
        source === Track.Source.ScreenShare ? "object-contain" : "object-cover"
      }`}
      muted={participant.isLocal}
      playsInline
      ref={videoRef}
    />
  );
});
