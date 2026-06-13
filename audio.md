# Audio Pipeline: Recording → Noise Canceling → Chimege → Summary → Action

This document explains what **actually happens today** to audio in a Brisk meeting, end to
end, and calls out the pieces that are **missing or incomplete** relative to the
"record → cancel noise → transcribe → summarize → take action" pipeline the product wants.

Everything below is based on the current code under `server/src/controllers/meetingTranscription/`
and `client/app/meeting/`.

---

## 1. End-to-end flow (as implemented today)

```
Client (LiveKit Room)
  │  publishes mic audio with audioCaptureDefaults:
  │    noiseSuppression / echoCancellation / autoGainControl
  ▼
Server: POST /api/meeting-transcription/start-egress
  │  startRoomEgress() → LiveKit RoomCompositeEgress (audioOnly: true, MP3)
  │  output → Cloudflare R2 via S3Upload
  │  meetingTranscriptions row created (status: "processing")
  ▼
LiveKit records raw room audio → uploads .mp3 to R2
  │
  ├── Path A: LiveKit webhook → POST /api/meeting-transcription/livekit-webhook
  │      finalizeRecordingUrl() when egress is final
  │
  └── Path B: POST /api/meeting-transcription/stop-egress
         stopRoomEgress() → pollEgressUntilFinal() → finalizeEgressRecording()
  ▼
finalizeRecordingUrl / finalizeEgressRecording
  │  looks up meetingTranscriptions row by egressId
  │  calls transcribeRecording()
  ▼
transcribeRecording()
  │  1. downloadRecordingFromR2()  -- SigV4-signed GET of the .mp3
  │  2. transcribeAudio()          -- Chimege STT (upload + poll)
  │  3. generateGroqSummary()      -- Groq LLM summary (if no summary passed in)
  │  4. update meetingTranscriptions row: transcript, summary, status: "done", completedAt
  ▼
Client reads results via
  GET /api/meeting-transcription/:id
  GET /api/meeting-transcription/latest
  GET /api/meeting-transcription
```

Noise suppression / echo cancellation / auto gain control are applied at capture time
via LiveKit's `audioCaptureDefaults` (see §2.1, §6.1). There is still no dedicated
server-side denoising step on the recorded `.mp3` before it reaches Chimege.

---

## 2. Stage-by-stage detail

### 2.1 Audio capture (client)

- `client/app/meeting/hooks/use-livekit-room.ts` creates the room with:
  ```ts
  const activeRoom = new Room({
    audioCaptureDefaults: {
      noiseSuppression: true,
      echoCancellation: true,
      autoGainControl: true,
    },
  });
  ```
- These are passed through to the browser's `getUserMedia` constraints for the
  published mic track, so the publishing track applies WebRTC-level noise
  suppression, echo cancellation, and automatic gain control before the audio
  reaches LiveKit/egress.
- ✅ §6.1 is resolved for client-side capture — see below. A server-side denoising
  pass on the egress `.mp3` (before Chimege) is still not implemented and may still
  be worth considering for noisy environments.

### 2.2 Egress / recording (server)

File: `server/src/controllers/meetingTranscription/livekit-egress.service.ts`

- `startRoomEgress()` (line 86) starts a `RoomCompositeEgress` with `audioOnly: true`,
  encoding to MP3 (`EncodedFileType.MP3`), uploaded to R2 via `S3Upload` at
  `meetings/${meetingId}/${transcriptionId}-{time}.mp3`.
- Requires env vars: `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`,
  `R2_SECRET_ACCESS_KEY`, `LIVEKIT_API_URL`/`LIVEKIT_URL`, `LIVEKIT_API_KEY`,
  `LIVEKIT_API_SECRET`, optional `LIVEKIT_EGRESS_WEBHOOK_URL`.
- `stopRoomEgress()` (line 122) / `getRoomEgressInfo()` (line 132) are used by the
  manual stop path.

Entry points:

- `server/src/controllers/meetingTranscription/start-egress.ts` — creates the
  `meetingTranscriptions` row (`status: "processing"`), starts egress, saves `egressId`.
- `server/src/controllers/meetingTranscription/stop-egress.ts` — stops egress, then
  calls `pollEgressUntilFinal()` (8 attempts, 1500ms apart,
  `egress-polling.service.ts`) and finalizes the recording.

### 2.3 Egress finalization

File: `server/src/controllers/meetingTranscription/egress-finalization.service.ts`

- `isCompleteEgress` / `isFailedEgress` (lines 83, 87) classify LiveKit egress status.
- `finalizeEgressRecording` (line 95, used by the polling/stop path) and
  `finalizeRecordingUrl` (line 138, used by the webhook path) both:
  1. find the `meetingTranscriptions` row by `egressId`,
  2. extract the recording URL via `getEgressRecordingUrl` (line 75),
  3. call `transcribeRecording()`.

### 2.4 Webhook path

File: `server/src/controllers/meetingTranscription/livekit-webhook.ts`

- `liveKitWebhook` reads the raw request body and `Authorization` header, and
  verifies the request with `livekit-server-sdk`'s `WebhookReceiver.receive()`
  (HMAC over the raw body, checked against `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`).
  Unverified requests are rejected with **401** before any payload parsing happens.
- ✅ §6.5 is resolved — see below.
- Once verified, the raw body is `JSON.parse`'d and passed to
  `parseLiveKitEgressCompletePayload` (`livekit-webhook-parser.ts`); on a final event
  it calls `finalizeRecordingUrl`.

### 2.5 Downloading the recording from R2

File: `server/src/controllers/meetingTranscription/r2-recording-download.service.ts`

- `downloadRecordingFromR2` (line 175) manually implements AWS SigV4 signing
  (`sha256Hex`, `hmac`, `getSigningKey`) to GET the `.mp3` object from R2 before
  handing the bytes to Chimege.

### 2.6 Transcription (Chimege)

File: `server/src/controllers/meetingTranscription/chimege-client.ts`

- `transcribeAudio` (line 52):
  1. Uploads the audio buffer via `FormData` to `POST https://api.chimege.com/v1.2/stt-long`,
     receiving a `uuid`.
  2. Polls `GET .../v1.2/stt-long-transcript` up to **30 times, 2s apart (60s timeout)**
     until `job.done && job.transcription`.
  3. Returns the transcription as a **single flat string**.
- **⚠️ Line 88: `// TODO: Move polling out of the request lifecycle for production Workers.`**
  (see §6.6)

Chimege's response is **not speaker-diarized and has no timestamps** — it's one block
of text for the whole meeting (see §6.2).

### 2.7 Summary generation (Groq)

Files: `server/src/lib/groq/groq-client.ts`, `server/src/lib/groq/groq-keys.ts`

- `generateGroqSummary(bindings, transcript, participantNames?)` POSTs to
  `https://api.groq.com/openai/v1/chat/completions` (model from `resolveGroqModel`,
  default `llama-3.1-8b-instant`), with `response_format: { type: "json_object" }`.
- The prompt asks for a **Mongolian-language JSON** object shaped like:
  ```json
  {
    "mainTopics": ["..."],
    "keyDecisions": ["..."],
    "actionItems": [{ "owner": "...", "action": "..." }]
  }
  ```
- `resolveMeetingGroqKey` / `resolveGenerativeGroqKey` pick
  `GROQ_MEETING_API_KEY || GROQ_API_KEY` and `GROQ_GENERATIVE_API_KEY || GROQ_API_KEY`
  respectively.
- The function returns the **raw JSON text as a string**. `transcribeRecording` now
  also parses this text via `parseMeetingSummary`
  (`server/src/lib/groq/parse-meeting-summary.ts`) into
  `{ mainTopics, keyDecisions, actionItems }` for structured persistence — see §2.8,
  §6.3, §6.4.

### 2.8 Persistence

File: `server/src/controllers/meetingTranscription/meeting-transcription.service.ts`

- `transcribeRecording` (takes `meetingId` and optional `userId` in addition to
  `transcriptionId`, see §2.10):
  1. If `userId` is provided: `INSERT INTO meetings (id, userId, title) ...
     ON CONFLICT (id) DO NOTHING` — `id: meetingId`, `title: "Meeting - <localeDateString>"`.
     Runs before any Chimege/Groq calls, and is idempotent (a pre-existing `meetings`
     row for this `meetingId` is left untouched).
  2. `downloadRecordingFromR2`
  3. `transcribeAudio` → `transcript: string`
  4. `generateGroqSummary` (only if no `summary` was passed in) → `summary: string` (raw JSON text)
  5. `parseMeetingSummary(summary)` → `{ mainTopics, keyDecisions, actionItems } | null`
  6. Batches (via `runD1Statements`/`db.batch`) the following writes:
     - always: update the `meetingTranscriptions` row — `transcript`, `summary`
       (raw JSON text, kept for backward compatibility), `status: "done"`, `completedAt`.
     - if the summary parsed successfully **and** a `meetings` row exists with
       `id === meetingId`: upsert (`onConflictDoUpdate` on `meetingId`) a
       `meetingSummaries` row — `content` (= `mainTopics.join("\n")`), `keyPoints`
       (= `keyDecisions`), `actionItems` (= `actionItems`).
     - if no matching `meetings` row exists (i.e. step 1 didn't run because `userId`
       was `null`, and no other flow created one), the `meetingSummaries` write is
       **skipped** and a warning is logged (see §6.3).
- **⚠️ TODO: Move audio download and Chimege polling into a Queue/Workflow for production Workers.**
  (see §6.6)

Storage targets:

- **Existing flat table** `meetingTranscriptions`
  (`server/src/schema/meetingTranscription/meeting-transcription.schema.ts`):
  ```
  id, meetingId (string, no FK), roomName, audioUrl, egressId,
  transcript (text), summary (text), participantNames (json string[]),
  errorMessage, status (pending|processing|done|failed),
  createdAt, updatedAt, completedAt
  ```
- **New normalized table** `meetingSummaries`
  (`server/src/schema/meeting.model.ts`), conditionally — see §3 and §6.3:
  ```
  id, meetingId (FK → meetings, cascade, unique),
  content (text), keyPoints (json string[]),
  actionItems (json { owner, action }[]),
  createdAt, updatedAt
  ```

### 2.9 Retrieval

- `GET /api/meeting-transcription/:id`, `GET /api/meeting-transcription/latest`,
  `GET /api/meeting-transcription` — read directly from `meetingTranscriptions`.
- `DELETE /api/meeting-transcription/:id` — deletes a row.

### 2.10 Token generation & userId propagation (new)

Files: `server/src/controllers/meetingRoom/post-create-room.ts`,
`server/src/controllers/meetingRoom/post-join-room.ts`

- Both routes call `getAuthenticatedUserId(c)` (`server/src/lib/auth/clerk.ts`), which
  resolves a Clerk Bearer token (from the `Authorization` header) to our internal
  `users.id`, or returns `null` if no/invalid token is present.
- If a `userId` is resolved, it's serialized as `metadata: JSON.stringify({ userId })`
  and attached to:
  - `postCreateRoom`: both `roomService.createRoom({ ..., metadata })` (LiveKit **Room**
    metadata, persisted on the room) and the host's `AccessToken` (participant metadata).
  - `postJoinRoom`: the joining participant's `AccessToken` (participant metadata only).
- LiveKit echoes `room.metadata` / `participant.metadata` back in webhook payloads.
  `parseLiveKitEgressCompletePayload` (`livekit-webhook-parser.ts`) now extracts `userId`
  from `payload.room.metadata`, falling back to `payload.participant.metadata`, and
  returns it alongside `egressId` / `recordingUrl` / etc.
- `liveKitWebhook` passes this `userId` to `finalizeRecordingUrl` → `transcribeRecording`,
  which uses it to create the `meetings` row before running Chimege/Groq (see §2.8, §6.3).
- ✅ The client side of this is now wired up too:
  - `client/app/meeting/api/meeting-api.ts`'s `meetingApi` reads
    `window.Clerk.session.getToken()` (set by `<ClerkProvider>`) and attaches
    `Authorization: Bearer <token>` to every request to the Next.js `meeting/api/*`
    routes.
  - The Next.js proxy (`meeting-proxy.ts`'s `proxyMeetingPostRequest` /
    `proxyMeetingRequest`) reads the incoming `Authorization` header and forwards it
    unchanged to the Cloudflare Worker (`/api/meeting-room/create`, `/join-room`, etc.).
  - `getAuthenticatedUserId(c)` on the server can therefore resolve a real `users.id`
    for signed-in users, completing the chain described above.
- Caveat: if the signed-in user has no Clerk session (e.g. guest/unauthenticated
  participants joining via `postJoinRoom`), `getAuthenticatedUserId` still returns
  `null` and `metadata` is omitted for that token — this is expected, not a bug.

---

## 3. The new normalized schema (partially wired up)

`server/src/schema/meeting.model.ts` defines a clean, relational schema for the
speech-to-text pivot:

- `meetings` — `id, userId (FK → users, cascade), title, createdAt, updatedAt`
- `meetingTranscriptSegments` — `id, meetingId (FK → meetings, cascade), speakerName, text, timestamp`
- `meetingSummaries` — `id, meetingId (FK → meetings, cascade, unique), content, keyPoints (json string[]), actionItems (json { owner, action }[]), createdAt, updatedAt`

`meetings`, `meetingSummaries`, and `meetingTranscriptSegments` now all have writers in
`transcribeRecording` (§2.8): if a `userId` is available (propagated via LiveKit
room/participant metadata, §2.10), a `meetings` row is created (idempotently) before
transcription runs, which then unblocks the `meetingSummaries` upsert and the
`meetingTranscriptSegments` bulk insert (§6.2). The client now sends a Clerk
`Authorization` header through the meeting-room proxy chain (§2.10 / §6.3), so for
signed-in users `userId` resolves to a real `users.id` end-to-end and all three writes
go through.

A read path now exists too: `GET /api/meetings/:id/details`
(`server/src/controllers/meetings/get-meeting-details.ts`, routed via
`server/src/routes/meetings/meetings.routes.ts`) requires
`getAuthenticatedUserId(c)`, checks `meetings.userId === userId`, and returns
`{ meeting, transcription, summary, transcriptSegments }` — the latest
`meetingTranscriptions` row plus the joined `meetingSummaries` and
`meetingTranscriptSegments` rows for that meeting (§6.4).

---

## 4. Required environment / secrets

| Variable | Used by |
| --- | --- |
| `LIVEKIT_API_URL` / `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | `livekit-egress.service.ts`, `livekit-webhook.ts` |
| `LIVEKIT_EGRESS_WEBHOOK_URL` (optional) | `livekit-egress.service.ts` |
| `R2_ACCOUNT_ID`, `R2_BUCKET_NAME`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | `livekit-egress.service.ts`, `r2-recording-download.service.ts` |
| Chimege API key | `chimege-client.ts` |
| `GROQ_API_KEY` / `GROQ_MEETING_API_KEY` / `GROQ_GENERATIVE_API_KEY` | `groq-keys.ts`, `groq-client.ts` |

---

## 5. Routes (`server/src/routes/meetingTranscription/meeting-transcription.routes.ts`)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/start-egress` | Begin recording a meeting room |
| POST | `/stop-egress` | Stop recording, poll until final, finalize |
| POST | `/livekit-webhook` | LiveKit egress completion webhook |
| POST | `/summary` | Manual entry (`postMeetingSummary`) |
| GET | `/` | List transcriptions |
| GET | `/latest` | Get latest transcription |
| GET | `/:id` | Get one transcription |
| DELETE | `/:id` | Delete a transcription |

---

## 6. ⚠️ Missing / incomplete pieces

These are the gaps between "record → cancel noise → Chimege → summary → action" and
what the code actually does today.

### 6.1 ✅ FIXED (client capture) — background noise suppression now enabled
- **Client**: `new Room()` in `use-livekit-room.ts` now passes
  `audioCaptureDefaults: { noiseSuppression: true, echoCancellation: true,
  autoGainControl: true }`, so the published mic track requests these WebRTC
  constraints from the browser before audio is sent to LiveKit/egress.
- **Server**: `transcribeRecording` still feeds the raw egress `.mp3` straight to
  Chimege — there is no additional server-side denoising pass, but the audio it
  receives has already gone through browser-level noise suppression.
- The "noise-canceling" **cosmetic UI label**
  (`STAGE_LABELS["noise-canceling"] = "Reducing background noise"` in
  `client/components/recordings/upload-recording-dialog.tsx`, driven by **fully
  mocked** data in `client/lib/mock-api.ts`) is part of an unrelated "Recordings"
  upload feature and is still **not connected to the real LiveKit/Chimege pipeline**
  — left as-is, out of scope for this fix.
- **Optional follow-up**: a server-side denoising pass on the egress `.mp3` (or a
  Krisp-style plugin) could still help for very noisy rooms, but browser-level
  suppression covers the common case.

### 6.2 ✅ FIXED (LLM post-processing) — `meetingTranscriptSegments` now populated via Groq
- Chimege's `stt-long` API still returns one flat transcription string for the whole
  recording — no per-speaker segments, no timestamps. That has not changed.
- `transcribeRecording` (`meeting-transcription.service.ts`) now makes a second,
  targeted Groq call right after Chimege returns: `generateGroqTranscriptSegments`
  (`server/src/lib/groq/groq-client.ts`) sends the flat Mongolian transcript plus
  `participantNames` and asks for
  `{"segments": [{ "speakerName": string, "text": string, "timestampSeconds": number }]}`,
  with `speakerName` matched against the real participant names (or `"Тодорхойгүй"` if
  none match) and `timestampSeconds` an LLM-estimated, increasing-from-0 offset.
- `parseMeetingTranscriptSegments` (`server/src/lib/groq/parse-meeting-transcript-segments.ts`)
  validates the raw JSON with a `zod` schema (`{ segments: { speakerName, text,
  timestampSeconds }[] }`), returning `null` if parsing/validation fails or the array
  is empty.
- If segments are returned, `transcribeRecording` converts each `timestampSeconds`
  into a `Date` (`now + timestampSeconds` seconds) and, in the same `db.batch()` as the
  `meetingTranscriptions`/`meetingSummaries` writes, bulk-inserts one row per segment
  into `meetingTranscriptSegments` (`id, meetingId, speakerName, text, timestamp`) —
  gated on the same `meetings` row lookup as §6.3, so it requires `userId` propagation
  to have created that row.
- The Groq call for segments is wrapped in its own try/catch: if it throws (e.g. rate
  limit, malformed JSON), `transcriptSegments` is left `null`, a warning is logged, and
  the rest of the pipeline (transcript + summary) proceeds unaffected.
- **Remaining limitation**: `timestampSeconds` is an LLM estimate, not derived from real
  audio timing — Chimege still doesn't expose per-word/segment timestamps, so these
  values are approximate ordering markers rather than precise wall-clock offsets.

### 6.3 ✅ FIXED — `meetings`/`meetingSummaries` writers exist and are wired end-to-end for signed-in users
- `generateGroqSummary`'s raw JSON string is still stored verbatim in
  `meetingTranscriptions.summary` (kept for backward compatibility with the existing
  `GET /api/meeting-transcription/*` responses and `MeetingSummaryCard` client UI).
- `transcribeRecording` now also calls `parseMeetingSummary` (
  `server/src/lib/groq/parse-meeting-summary.ts`) to extract
  `{ mainTopics, keyDecisions, actionItems }`, and — in the same `db.batch()` as the
  `meetingTranscriptions` update — upserts a `meetingSummaries` row keyed by
  `meetingId` (`content = mainTopics.join("\n")`, `keyPoints = keyDecisions`,
  `actionItems = actionItems`).
- `meetingSummaries.meetingId` is a `NOT NULL` FK to `meetings.id`. To satisfy this,
  `postCreateRoom`/`postJoinRoom` embed `JSON.stringify({ userId })` as LiveKit
  room/participant metadata (§2.10), `parseLiveKitEgressCompletePayload` extracts
  `userId` from the webhook payload's `room.metadata`/`participant.metadata`, and
  `transcribeRecording` uses it to `INSERT ... ON CONFLICT DO NOTHING` a `meetings`
  row (`id: meetingId, userId, title`) before the `meetingSummaries` upsert runs.
- The previously-missing piece — the client never sent a Clerk `Authorization` header
  through the proxy chain — is now fixed: `meeting-api.ts`'s `meetingApi` retrieves a
  token via `window.Clerk.session.getToken()` and sends `Authorization: Bearer <token>`
  on every call; `meeting-proxy.ts` forwards that header unchanged to
  `/api/meeting-room/create` and `/join-room`. `getAuthenticatedUserId(c)` now resolves
  a real `users.id` for signed-in users, so the `meetings` row is created and the
  `meetingSummaries` upsert fires instead of logging the `"No meetings row for
  meetingId; skipping meetingSummaries write"` warning.
- **Remaining caveat**: this only works when at least one participant who calls
  `postCreateRoom`/`postJoinRoom` is signed in via Clerk. A fully anonymous/guest
  session (no Clerk token at all) still yields `userId: null`, `metadata` is omitted
  from that token, and the `meetings` row is never created for that meeting — the
  `meetingSummaries` write would still be skipped with the warning above in that case.
  This is expected behavior, not a bug, given the schema's `NOT NULL` FK to `users`.

### 6.4 ✅ FIXED — relational meeting details now have a read path and a UI
- `meetingSummaries.actionItems` is typed `{ owner: string; action: string }[]`
  (matches Groq's actual output) and is populated by `transcribeRecording` for
  signed-in users now that §6.3's `meetings`/`meetingSummaries` writers are wired up
  end-to-end.
- `GET /api/meetings/:id/details` (see §3) exposes `meeting`, the latest
  `transcription` (`meetingTranscriptions` row, including `status`), `summary`
  (`meetingSummaries` row) and `transcriptSegments`
  (`meetingTranscriptSegments[]`) in one response.
- Client: `fetchMeetingAnalysisDetails(meetingId)`
  (`client/app/meeting/api/fetch-meeting-analysis-details.ts`) calls this endpoint
  through the existing `meetingApi()` wrapper (Clerk `Authorization: Bearer <token>`
  attached automatically) via
  `MEETING_ENDPOINTS.meetingDetails` → `client/app/meeting/api/meetings/[id]/details/route.ts`
  → `BACKEND_MEETING_ENDPOINTS.meetingDetails` → `/api/meetings/:id/details`.
- New presentational components render the structured data:
  `client/components/meetings/ActionItemsChecklist.tsx` renders
  `meetingSummaries.actionItems` as an interactive checklist with an owner badge per
  item, and `client/components/meetings/MeetingDiarizedTranscript.tsx` renders
  `meetingTranscriptSegments` as a chronological, script-style dialogue timeline with
  per-segment relative timestamps (`mm:ss` / `h:mm:ss` from the first segment).
- Both are wired into `client/components/meetings/MeetingAnalysisPanel.tsx`, which is
  rendered from `client/app/meetings/[id]/page.tsx` (see §6.6 for the
  loading/polling behavior).
- **Remaining limitation**: the checklist's "completed" state is local UI state only
  (not persisted), and there is still no code that turns action items into
  tasks/reminders/notifications — the checklist is the full extent of "acting on"
  them today.

### 6.5 ✅ FIXED — LiveKit webhook signatures are now verified
- `livekit-webhook.ts` now reads the raw body (`c.req.text()`) and `Authorization`
  header, and calls `livekit-server-sdk`'s `WebhookReceiver.receive(rawBody, authHeader)`
  (constructed from `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`) before any other processing.
- If verification throws (missing/invalid `Authorization` header, or body/signature
  mismatch), the handler immediately returns **401 `{ error: "Invalid webhook signature" }`**
  and never calls `finalizeRecordingUrl`.
- Only after successful verification is the raw body `JSON.parse`'d and handed to
  `parseLiveKitEgressCompletePayload` as before.

### 6.6 ✅ FIXED — Chimege polling & R2 download moved to a Cloudflare Queue
- `chimege-client.ts` line 88 and `meeting-transcription.service.ts` line 109 used to
  flag that `transcribeRecording` (R2 download + up to 60s of Chimege polling) ran
  inline inside a single request handler — risking Cloudflare Workers' execution time
  limits on longer meetings and leaving the transcription stuck in
  `status: "processing"` if the Worker was killed mid-request.
- `server/wrangler.jsonc` now declares a `meeting-transcription-jobs` queue with a
  producer binding `MEETING_TRANSCRIPTION_QUEUE` (and a consumer with
  `max_retries: 3`, `max_batch_size: 1`) in both the default and `production` envs.
  `Bindings.MEETING_TRANSCRIPTION_QUEUE: Queue<MeetingTranscriptionJob>` and the
  `MeetingTranscriptionJob = { egressId, recordingUrl, userId? }` type live in
  `server/src/lib/common/types.ts`.
- Both entry points that used to call `transcribeRecording` synchronously now enqueue
  a job instead and return immediately (leaving `meetingTranscriptions.status` as
  `"processing"`):
  - `livekit-webhook.ts` (`liveKitWebhook`) sends `{ egressId, recordingUrl, userId }`
    (`userId` from LiveKit room/participant metadata, §2.10/§6.3) and responds with
    `status: "queued"`.
  - `stop-egress.ts` (`stopEgress`), via `finalizeEgressRecording`
    (`egress-finalization.service.ts`), extracts `recordingUrl` from the finished
    LiveKit egress, sends `{ egressId, recordingUrl, userId: null }`, and responds
    with `status: "queued"` (its missing-`recordingUrl` → `markFailed` guard is
    unchanged).
- The actual work moved to a new consumer:
  `server/src/queues/meeting-transcription-queue.ts` exports
  `handleMeetingTranscriptionQueue(batch, env)`, wired up in `server/src/index.ts` as
  `export default { fetch: app.fetch, queue: handleMeetingTranscriptionQueue }`. For
  each message it calls the existing `finalizeRecordingUrl` (→ `transcribeRecording`,
  R2 download + Chimege polling + Groq summary/segments + D1 writes, all unchanged) —
  on success it `ack()`s the message; on failure (which already calls `markFailed`
  internally) it `retry()`s while `message.attempts < 3`, then `ack()`s to stop
  retrying a job whose `"failed"` status is already persisted.
- **Frontend unaffected**: `client/app/meeting/hooks/use-transcription-status.ts`
  already polls `GET /api/meeting-transcription/:id` every 4s while `status` is
  `"pending"`/`"processing"` and stops at `"done"`/`"failed"` (§6.4); `"queued"` is
  just a transient response from `/stop-egress` and `/livekit-webhook` and isn't a
  `meetingTranscriptions.status` value, so no client changes were needed.
- **Deployment prerequisite**: the queue must exist before this works —
  `wrangler queues create meeting-transcription-jobs` (and re-run
  `wrangler deploy`/`wrangler dev` to pick up the new bindings).
- **Chimege polling within the consumer**: `transcribeAudio`'s up-to-60s poll loop
  (`chimege-client.ts`) is mostly `fetch`/`setTimeout` I/O wait rather than CPU time,
  so it should fit Cloudflare Queue consumers' default CPU-time limits; no
  `limits.cpu_ms` override was added. Revisit if Chimege transcriptions start timing
  out in the consumer.

### 6.7 ✅ FIXED — orphaned `validate-meeting-audio.ts` removed
- `validateMeetingAudio(file)` (MIME type check for `audio/mpeg|wav|mp4|ogg` + 100MB
  max size) had zero references anywhere in `server/` or `client/` and no
  manual-upload route exists.
- The file `server/src/controllers/meetingTranscription/validate-meeting-audio.ts`
  has been deleted. If a manual-upload route is added later, equivalent validation
  should be (re)written alongside that route.

---

## 7. Suggested next steps (priority order)

1. ~~Wire the client's meeting-room calls to send a Clerk `Authorization: Bearer
   <token>` header through `meeting-api.ts` → the Next.js `meeting/api/*` proxy routes
   → `meeting-proxy.ts` → `/api/meeting-room/create` and `/join-room` (§2.10/§6.3)~~ —
   done. The `userId` → `meetings` row → `meetingSummaries` upsert chain is now live
   end-to-end for signed-in users.
   ~~Populate `meetingTranscriptSegments` via an LLM diarization pass over the flat
   Chimege transcript (§6.2)~~ — done.
   ~~Add a read path + UI for `meetingSummaries`/`meetingTranscriptSegments`
   (§6.4)~~ — done via `GET /api/meetings/:id/details` and
   `MeetingAnalysisPanel`/`ActionItemsChecklist`/`MeetingDiarizedTranscript`. Next:
   persist action-item completion and decide on follow-up
   tasks/notifications/reminders.
2. ~~Decide on and implement an actual noise-suppression strategy (§6.1)~~ — client-side
   `audioCaptureDefaults` done; server-side denoising remains optional.
3. ~~Verify LiveKit webhook signatures (§6.5)~~ — done.
4. ~~Move Chimege polling + R2 download off the request path (§6.6)~~ — done (now
   runs in `handleMeetingTranscriptionQueue` via `MEETING_TRANSCRIPTION_QUEUE`); run
   `wrangler queues create meeting-transcription-jobs` before deploying.
5. ~~Resolve or remove `validate-meeting-audio.ts` (§6.7)~~ — done (removed).

