import { Context } from "hono";
import { useDB } from "../../lib/db/db";
import { getAuthenticatedUserId } from "../../lib/auth/clerk";
import {
  findRecordingForUser,
  listRecordingsForUser,
} from "./recordings.service";
import type { Bindings, Variables } from "../../lib/common/types";

export const getRecordings = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const db = useDB(c);
    const recordings = await listRecordingsForUser(db, userId);

    return c.json({ recordings }, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

export const getRecording = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "id is required" }, 400);
  }

  try {
    const db = useDB(c);
    const recording = await findRecordingForUser(db, id, userId);

    if (!recording) {
      return c.json({ error: "Recording not found" }, 404);
    }

    return c.json(recording, 200);
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};

// Streams the raw uploaded audio back from R2 so the owner can listen to their
// own recording in the browser (e.g. to A/B test mic noise suppression). This
// is the original blob captured by MediaRecorder, not the transcode sent to STT.
export const getRecordingAudio = async (
  c: Context<{ Bindings: Bindings; Variables: Variables }>,
) => {
  const userId = await getAuthenticatedUserId(c);

  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = c.req.param("id");

  if (!id) {
    return c.json({ error: "id is required" }, 400);
  }

  try {
    const db = useDB(c);
    const recording = await findRecordingForUser(db, id, userId);

    if (!recording) {
      return c.json({ error: "Recording not found" }, 404);
    }

    const object = await c.env.R2_BUCKET.get(recording.audioUrl);

    if (!object) {
      return c.json({ error: "Recording audio not found" }, 404);
    }

    const headers = new Headers();
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType ?? "audio/mpeg",
    );
    headers.set("Content-Length", String(object.size));
    headers.set("Cache-Control", "private, max-age=3600");

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    return c.json({ error: (error as Error).message }, 500);
  }
};
