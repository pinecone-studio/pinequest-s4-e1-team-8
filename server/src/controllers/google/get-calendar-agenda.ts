import type { Context } from "hono";
import type { Bindings, Variables } from "../../lib/common/types";
import { fetchCalendarAgenda } from "../../lib/google/google-calendar.service";
import { getGoogleAccessToken } from "../../lib/google/google-token.service";
import { useDB } from "../../lib/db/db";

type HonoEnv = { Bindings: Bindings; Variables: Variables };

export const getCalendarAgenda = async (c: Context<HonoEnv>) => {
  const userId = c.get("userId");
  const db = useDB(c);
  const accessToken = await getGoogleAccessToken(db, userId, c.env);

  if (!accessToken) {
    return c.json({ connected: false, events: [] });
  }

  const timeMin = c.req.query("timeMin")?.trim();
  const timeMax = c.req.query("timeMax")?.trim();
  const timeZone = c.req.query("timeZone")?.trim();

  const bounds =
    timeMin && timeMax
      ? { timeMin, timeMax, timeZone: timeZone || undefined }
      : undefined;

  try {
    const events = await fetchCalendarAgenda(accessToken, bounds);
    return c.json({ connected: true, events });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load calendar.";
    return c.json({ error: message }, 502);
  }
};
