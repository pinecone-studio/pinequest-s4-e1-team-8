import { Context } from "hono";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import type { Bindings, Variables } from "../../lib/common/types";

const getLiveKitApiUrl = (env: Bindings) => {
  const url = env.LIVEKIT_API_URL ?? env.LIVEKIT_URL;

  if (url.startsWith("wss://")) return url.replace("wss://", "https://");
  if (url.startsWith("ws://")) return url.replace("ws://", "http://");
  return url;
};

const getLiveKitFrontendUrl = (env: Bindings) => {
  return env.LIVEKIT_WS_URL ?? env.LIVEKIT_URL;
};

export const postCreateRoom = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  try {
    const { roomName, hostName } = await c.req.json();

    if (!roomName) return c.json({ error: "roomName is required" }, 400);
    if (!hostName) return c.json({ error: "hostName is required" }, 400);

    const userId = await getAuthenticatedUserId(c);
    const metadata = userId ? JSON.stringify({ userId }) : undefined;

    const roomService = new RoomServiceClient(
      getLiveKitApiUrl(c.env),
      c.env.LIVEKIT_API_KEY,
      c.env.LIVEKIT_API_SECRET,
    );

    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 600,
      maxParticipants: 20,
      metadata,
    });

    const token = new AccessToken(
      c.env.LIVEKIT_API_KEY,
      c.env.LIVEKIT_API_SECRET,
      { identity: hostName, metadata },
    );

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      roomAdmin: true,
    });

    const jwt = await token.toJwt();

    return c.json(
      {
        roomName,
        token: jwt,
        url: getLiveKitFrontendUrl(c.env),
      },
      201,
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
