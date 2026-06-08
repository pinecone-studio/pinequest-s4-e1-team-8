import { Context } from "hono";
import { RoomServiceClient, TrackSource, TwirpError } from "livekit-server-sdk";
import type { Bindings } from "../../lib/common/types";

const getLiveKitApiUrl = (env: Bindings) => {
  const url = env.LIVEKIT_API_URL ?? env.LIVEKIT_URL;

  if (url.startsWith("wss://")) return url.replace("wss://", "https://");
  if (url.startsWith("ws://")) return url.replace("ws://", "http://");
  return url;
};

const hasUnmutedTrackFromSource = (
  tracks: { muted: boolean; source: TrackSource }[],
  source: TrackSource,
) => tracks.some((track) => track.source === source && !track.muted);

const isLiveKitRoomNotFoundError = (error: unknown) =>
  error instanceof TwirpError &&
  (error.status === 404 || error.code === "not_found");

export const getRoomParticipants = async (
  c: Context<{ Bindings: Bindings }>,
) => {
  const roomName = c.req.param("roomName");

  if (!roomName) return c.json({ error: "roomName is required" }, 400);

  const roomService = new RoomServiceClient(
    getLiveKitApiUrl(c.env),
    c.env.LIVEKIT_API_KEY,
    c.env.LIVEKIT_API_SECRET,
  );

  try {
    const participants = await roomService.listParticipants(roomName);

    const participantSummaries = participants.map((participant) => ({
      identity: participant.identity,
      isCameraEnabled: hasUnmutedTrackFromSource(
        participant.tracks,
        TrackSource.CAMERA,
      ),
      isMicrophoneEnabled: hasUnmutedTrackFromSource(
        participant.tracks,
        TrackSource.MICROPHONE,
      ),
      metadata: participant.metadata ?? "",
      name: participant.name || participant.identity,
    }));

    return c.json(
      {
        participants: participantSummaries,
        count: participantSummaries.length,
      },
      200,
    );
  } catch (error) {
    // LiveKit returns an error when the room has no active session yet —
    // treat that as "nobody has joined" rather than a failure.
    if (isLiveKitRoomNotFoundError(error)) {
      return c.json({ participants: [], count: 0 }, 200);
    }

    return c.json({ error: "Unable to load room participants." }, 500);
  }
};
