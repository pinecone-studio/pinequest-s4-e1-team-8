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
  const shouldDisableLocalMirroring =
    participant.isLocal && source === Track.Source.Camera;

  useEffect(() => {
    const publication = participant.getTrackPublication(source);
    const track = publication?.track;
    const element = videoRef.current;

    if (!track || !element) return;

    track.attach(element);
    if (shouldDisableLocalMirroring) {
      element.style.setProperty("transform", "scaleX(-1)", "important");
    }

    return () => {
      track.detach(element);
      element.style.removeProperty("transform");
    };
  }, [participant, shouldDisableLocalMirroring, source, version]);

  return (
    <div
      className={`h-full w-full ${
        shouldDisableLocalMirroring ? "local-video-unmirrored" : ""
      }`}
    >
      <video
        autoPlay
        className={`h-full w-full ${
          source === Track.Source.ScreenShare ? "object-contain" : "object-cover"
        }`}
        muted={participant.isLocal}
        playsInline
        ref={videoRef}
        style={
          shouldDisableLocalMirroring ? { transform: "scaleX(-1)" } : undefined
        }
      />
    </div>
  );
});
