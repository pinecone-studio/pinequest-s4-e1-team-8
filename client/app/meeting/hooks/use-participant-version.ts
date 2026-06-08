"use client";

import {
  ParticipantEvent,
  Track,
  type Participant,
  type TrackPublication,
} from "livekit-client";
import { useEffect, useState } from "react";

export const useParticipantTrackVersion = (
  participant: Participant,
  source: Track.Source,
) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setVersion((currentVersion) => currentVersion + 1);
    const refreshIfSourceMatches = (publication: TrackPublication) => {
      if (publication.source === source) {
        refresh();
      }
    };
    const refreshSubscribedSource = (
      _track: unknown,
      publication: TrackPublication,
    ) => refreshIfSourceMatches(publication);

    participant
      .on(ParticipantEvent.TrackSubscribed, refreshSubscribedSource)
      .on(ParticipantEvent.TrackUnsubscribed, refreshSubscribedSource)
      .on(ParticipantEvent.LocalTrackPublished, refreshIfSourceMatches)
      .on(ParticipantEvent.LocalTrackUnpublished, refreshIfSourceMatches)
      .on(ParticipantEvent.TrackMuted, refreshIfSourceMatches)
      .on(ParticipantEvent.TrackUnmuted, refreshIfSourceMatches);

    return () => {
      participant
        .off(ParticipantEvent.TrackSubscribed, refreshSubscribedSource)
        .off(ParticipantEvent.TrackUnsubscribed, refreshSubscribedSource)
        .off(ParticipantEvent.LocalTrackPublished, refreshIfSourceMatches)
        .off(ParticipantEvent.LocalTrackUnpublished, refreshIfSourceMatches)
        .off(ParticipantEvent.TrackMuted, refreshIfSourceMatches)
        .off(ParticipantEvent.TrackUnmuted, refreshIfSourceMatches);
    };
  }, [participant, source]);

  return version;
};
