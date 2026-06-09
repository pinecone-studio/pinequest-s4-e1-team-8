# Cloudflare Workers API starter with Hono & Drizzle ORM for D1 DB

**Purpose:** A small Cloudflare Workers API starter with **Hono**, **Drizzle ORM**, and **D1** so you can ship typed routes and migrations without wiring everything from scratch.

## Install with Bun (ready to dev)

```bash
bun install
bun run cf-typegen
bun run db:migrate:local
bun run dev
```

`bun install` pulls in Hono, Drizzle ORM, Drizzle Kit, Wrangler, and `@cloudflare/workers-types`. `cf-typegen` refreshes Worker binding types from `wrangler.jsonc`. `db:migrate:local` applies existing SQL migrations to your **local** D1 so the sample user routes can hit a real table. Then `dev` starts Wrangler on port **8787** by default.

For **remote** Drizzle Kit (`drizzle-kit generate`), copy `.env.example` to `.env.local` and fill in the Cloudflare variables. Before **deploy**, create a D1 database, set `database_name` / `database_id` in `wrangler.jsonc` to match your project, and align the `db:migrate:*` script names in `package.json` if you rename the database.

## Sample users API

This repo already includes **users routes and a users schema** for quick testing. After `bun run dev`, try a **GET** request:

`http://localhost:8787/users`

## Meeting Recording Environments

Production recording flow must stay on production resources:

```text
deployed frontend
-> https://server-preset.danny-otgontsetseg.workers.dev
-> remote D1 database server-preset-db
-> LiveKit egress
-> R2 bucket brisk
-> remote D1 meeting_transcriptions row marked done
```

Local development should use local resources by default:

```text
local frontend
-> http://localhost:8787
-> local Wrangler D1 state
```

Use `client/.env.example` as the local client template. It intentionally points `API_URL` and `NEXT_PUBLIC_API_URL` at `http://localhost:8787`. Do not point local dev at the deployed Worker unless you explicitly want local UI actions to write to remote production D1.

Production egress finalization uses the LiveKit webhook URL configured in `server/wrangler.jsonc`:

```text
https://server-preset.danny-otgontsetseg.workers.dev/api/meeting-transcription/livekit-webhook
```

The stop-egress controller still polls briefly after stopping a recording, but production should rely on the webhook as the durable finalization path for recordings that complete after the polling window.

### Production Recording Verification

1. Open the deployed client and start a meeting recording.
2. Stop the recording and wait for LiveKit to show `EGRESS_COMPLETE`.
3. Query remote D1 for the newest rows:

```bash
cd server
bunx wrangler d1 execute server-preset-db --remote --command "SELECT id, meeting_id, room_name, egress_id, audio_url, transcript IS NOT NULL AS has_transcript, summary IS NOT NULL AS has_summary, status, error_message, completed_at FROM meeting_transcriptions ORDER BY created_at DESC LIMIT 10"
```

Expected result for the new recording:

```text
status = done
egress_id is not null
audio_url is not null
has_transcript = 1
has_summary = 1
completed_at is not null
```

If LiveKit shows `EGRESS_COMPLETE` but remote D1 has no matching `egress_id`, the recording was started against another Worker or database. If the row exists but remains `processing`, check Worker logs for the `LiveKit webhook received` and `Recording finalized` messages.

### AI secrets (Gemini / Groq)

Local keys live in `server/.dev.vars`. Production reads the same names as **Cloudflare Worker secrets** (`GEMINI_API_KEY`, `GROQ_API_KEY`). Deploying code does not update secrets — after rotating a key or fixing a leaked key, sync from `.dev.vars`:

```bash
cd server
node scripts/sync-secrets-from-dev-vars.mjs
bun run deploy
```

## Test POST (Postman, curl, etc.)

**POST** `http://localhost:8787/users` with `Content-Type: application/json` and this body:

```json
{
  "role": "admin",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "age": 25,
  "tel": "+10000000000"
}
```
