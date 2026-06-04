import { Context } from "hono";
import { AccessToken } from "livekit-server-sdk";
import type { Bindings } from "../../lib/common/types";

const getLiveKitFrontendUrl = (env: Bindings) => {
  return env.LIVEKIT_WS_URL ?? env.LIVEKIT_URL;
};

export const postJoinRoom = async (c: Context<{ Bindings: Bindings }>) => {
  try {
    const { roomName, participantName } = await c.req.json();

    if (!roomName) return c.json({ error: "roomName is required" }, 400);
    if (!participantName)
      return c.json({ error: "participantName is required" }, 400);

    const token = new AccessToken(
      c.env.LIVEKIT_API_KEY,
      c.env.LIVEKIT_API_SECRET,
      { identity: participantName },
    );

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    return c.json(
      {
        roomName,
        token: jwt,
        url: getLiveKitFrontendUrl(c.env),
      },
      200,
    );
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
