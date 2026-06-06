import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { Context } from "hono";
import { nanoid } from "nanoid";
import { Webhook } from "svix";
import * as schema from "../../schema/schema";
import { users } from "../../schema/schema";
import type { Bindings } from "../../lib/common/types";

type ClerkEmailAddress = {
  id: string;
  email_address: string;
};

type ClerkUserData = {
  id: string;
  email_addresses: ClerkEmailAddress[];
  primary_email_address_id: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
};

type ClerkUserDeletedData = {
  id: string;
  deleted: boolean;
};

type ClerkWebhookEvent =
  | { type: "user.created" | "user.updated"; data: ClerkUserData }
  | { type: "user.deleted"; data: ClerkUserDeletedData };

function resolvePrimaryEmail(data: ClerkUserData): string | null {
  if (data.primary_email_address_id) {
    const found = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id,
    );
    if (found) return found.email_address;
  }
  return data.email_addresses[0]?.email_address ?? null;
}

function buildFullName(data: ClerkUserData): string {
  return [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unknown";
}

export const clerkWebhook = async (c: Context<{ Bindings: Bindings }>) => {
  const secret = c.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return c.json({ error: "Webhook secret not configured" }, 500);
  }

  const rawBody = await c.req.text();
  const svixId = c.req.header("svix-id") ?? "";
  const svixTimestamp = c.req.header("svix-timestamp") ?? "";
  const svixSignature = c.req.header("svix-signature") ?? "";

  const wh = new Webhook(secret);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(rawBody, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return c.json({ error: "Invalid signature" }, 401);
  }

  const db = drizzle(c.env.DB, { schema });

  try {
    if (event.type === "user.created" || event.type === "user.updated") {
      const data = event.data;
      const email = resolvePrimaryEmail(data);
      if (!email) {
        return c.json({ error: "No email address found" }, 400);
      }

      const name = buildFullName(data);

      await db
        .insert(users)
        .values({
          id: nanoid(),
          clerkId: data.id,
          email,
          name,
          avatarUrl: data.image_url ?? null,
        })
        .onConflictDoUpdate({
          target: users.clerkId,
          set: {
            email,
            name,
            avatarUrl: data.image_url ?? null,
            updatedAt: new Date(),
          },
        });

      return c.json({ synced: true }, 200);
    }

    if (event.type === "user.deleted") {
      const { id } = event.data;
      await db.delete(users).where(eq(users.clerkId, id));
      return c.json({ deleted: true }, 200);
    }

    return c.json({ received: true }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database operation failed";
    return c.json({ error: message }, 500);
  }
};
