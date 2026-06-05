"use client";

import { ParticipantEvent, type Participant } from "livekit-client";
import { useEffect, useState } from "react";

export const useParticipantVersion = (participant: Participant) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((currentVersion) => currentVersion + 1);

    participant
      .on(ParticipantEvent.TrackSubscribed, refresh)
      .on(ParticipantEvent.TrackUnsubscribed, refresh)
      .on(ParticipantEvent.LocalTrackPublished, refresh)
      .on(ParticipantEvent.LocalTrackUnpublished, refresh)
      .on(ParticipantEvent.TrackMuted, refresh)
      .on(ParticipantEvent.TrackUnmuted, refresh);

    return () => {
      participant
        .off(ParticipantEvent.TrackSubscribed, refresh)
        .off(ParticipantEvent.TrackUnsubscribed, refresh)
        .off(ParticipantEvent.LocalTrackPublished, refresh)
        .off(ParticipantEvent.LocalTrackUnpublished, refresh)
        .off(ParticipantEvent.TrackMuted, refresh)
        .off(ParticipantEvent.TrackUnmuted, refresh);
    };
  }, [participant]);

  return version;
};
