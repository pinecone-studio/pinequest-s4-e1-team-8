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
  │  publishes mic audio, no audio processing config
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

There is **no background-noise-cancellation step** in this flow (see §3 and §6.1).

---

## 2. Stage-by-stage detail

### 2.1 Audio capture (client)

- `client/app/meeting/hooks/use-livekit-room.ts` creates the room with:
  ```ts
  const activeRoom = new Room();
  ```
- No `RoomOptions`, no `audioCaptureDefaults`, no `noiseSuppression` /
  `echoCancellation` / `autoGainControl`, and no Krisp (or any) noise-cancellation
  plugin is configured.
- Audio published to LiveKit is therefore **raw browser mic capture**, subject only
  to whatever defaults the browser's `getUserMedia` applies.

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
- The function returns the **raw JSON text as a string** — it is not parsed or
  validated before storage (see §6.3).

### 2.8 Persistence

File: `server/src/controllers/meetingTranscription/meeting-transcription.service.ts`

- `transcribeRecording` (line 88):
  1. `downloadRecordingFromR2`
  2. `transcribeAudio` → `transcript: string`
  3. `generateGroqSummary` (only if no `summary` was passed in) → `summary: string` (raw JSON text)
  4. Updates the `meetingTranscriptions` row: `transcript`, `summary`, `status: "done"`, `completedAt`.
- **⚠️ Line 109: `// TODO: Move audio download and Chimege polling into a Queue/Workflow for production Workers.`**

Storage target is the **existing flat table** `meetingTranscriptions`
(`server/src/schema/meetingTranscription/meeting-transcription.schema.ts`):

```
id, meetingId (string, no FK), roomName, audioUrl, egressId,
transcript (text), summary (text), participantNames (json string[]),
errorMessage, status (pending|processing|done|failed),
createdAt, updatedAt, completedAt
```

### 2.9 Retrieval

- `GET /api/meeting-transcription/:id`, `GET /api/meeting-transcription/latest`,
  `GET /api/meeting-transcription` — read directly from `meetingTranscriptions`.
- `DELETE /api/meeting-transcription/:id` — deletes a row.

---

## 3. The new normalized schema (added, not yet wired up)

`server/src/schema/meeting.model.ts` defines a clean, relational schema for the
speech-to-text pivot:

- `meetings` — `id, userId (FK → users, cascade), title, createdAt, updatedAt`
- `meetingTranscriptSegments` — `id, meetingId (FK → meetings, cascade), speakerName, text, timestamp`
- `meetingSummaries` — `id, meetingId (FK → meetings, cascade, unique), content, keyPoints (json), actionItems (json), createdAt, updatedAt`

This schema models exactly what the product wants (per-speaker segments + structured
summary with action items), but **nothing in the pipeline writes to these tables yet**
— see §6.3 and §6.4.

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

### 6.1 ❌ No real background noise cancellation
- **Client**: `new Room()` in `use-livekit-room.ts` has no `RoomOptions`,
  `audioCaptureDefaults`, `noiseSuppression`, `echoCancellation`, `autoGainControl`,
  or any Krisp/RNNoise-style plugin.
- **Server**: `transcribeRecording` feeds the raw egress `.mp3` straight to Chimege —
  no denoising step exists anywhere in `meetingTranscription/`.
- The only place "noise-canceling" appears in the codebase is as a **cosmetic UI
  label** (`STAGE_LABELS["noise-canceling"] = "Reducing background noise"` in
  `client/components/recordings/upload-recording-dialog.tsx`) driven by **fully
  mocked** data (`PROCESSING_STAGES`, `runProcessingStages`, `completeRecording` in
  `client/lib/mock-api.ts`). This is part of an unrelated "Recordings" upload feature
  and is **not connected to the real LiveKit/Chimege pipeline** at all.
- **Action needed**: either (a) enable LiveKit's built-in audio processing
  (`audioCaptureDefaults: { noiseSuppression: true, echoCancellation: true,
  autoGainControl: true }` and/or a Krisp noise-filter plugin) on the publishing
  track, and/or (b) add a server-side denoising pass on the egress `.mp3` before
  it's sent to Chimege.

### 6.2 ❌ No speaker diarization or timestamps from Chimege
- Chimege's `stt-long` API returns one flat transcription string for the whole
  recording — no per-speaker segments, no timestamps.
- The new `meetingTranscriptSegments` table (`speakerName, text, timestamp`) has
  **no writer at all**.
- `participantNames` is captured at egress-stop time and passed to Groq as prompt
  context, but it is never used to attribute parts of the transcript to specific
  speakers.
- **Action needed**: either switch to a diarization-capable STT provider/endpoint, or
  post-process the flat transcript (e.g., LLM-based speaker attribution) to populate
  `meetingTranscriptSegments`.

### 6.3 ❌ Summary is unparsed JSON text; new `meetingSummaries` table is unused
- `generateGroqSummary` returns the model's raw JSON string
  (`{mainTopics, keyDecisions, actionItems}`), which is stored verbatim in
  `meetingTranscriptions.summary` (a `text` column) — never parsed or validated.
- The new `meetingSummaries` table (`content`, `keyPoints` JSON, `actionItems` JSON)
  is **not populated by anything**.
- **Action needed**: parse/validate the Groq JSON response and write structured rows
  into `meetingSummaries` (and `meetings`, since `meetingSummaries.meetingId` is a
  FK into the new `meetings` table, not `meetingTranscriptions`).

### 6.4 ❌ Action items are generated but nothing "acts" on them
- Groq's `actionItems: { owner, action }[]` is produced but only ever lives inside
  the raw JSON string in `meetingTranscriptions.summary`.
- There is no code that creates tasks/reminders/notifications from these items, and
  no dedicated read path exposes them as structured data.
- **Action needed**: once §6.3 is fixed and `actionItems` are structured rows in
  `meetingSummaries.actionItems`, decide what "taking action" means (e.g., create
  follow-up tasks, send notifications/emails, or simply expose them via an API for
  the client to render as a checklist).

### 6.5 ✅ FIXED — LiveKit webhook signatures are now verified
- `livekit-webhook.ts` now reads the raw body (`c.req.text()`) and `Authorization`
  header, and calls `livekit-server-sdk`'s `WebhookReceiver.receive(rawBody, authHeader)`
  (constructed from `LIVEKIT_API_KEY`/`LIVEKIT_API_SECRET`) before any other processing.
- If verification throws (missing/invalid `Authorization` header, or body/signature
  mismatch), the handler immediately returns **401 `{ error: "Invalid webhook signature" }`**
  and never calls `finalizeRecordingUrl`.
- Only after successful verification is the raw body `JSON.parse`'d and handed to
  `parseLiveKitEgressCompletePayload` as before.

### 6.6 ❌ Chimege polling & R2 download run synchronously in the request lifecycle
- `chimege-client.ts` line 88 and `meeting-transcription.service.ts` line 109 both
  flag that `transcribeRecording` (R2 download + up to 60s of Chimege polling) runs
  inline inside a single request handler.
- On longer meetings this risks hitting Cloudflare Workers' execution time limits and
  leaves the transcription stuck in `status: "processing"` if the Worker is killed.
- **Action needed**: move this work to a Queue (Cloudflare Queues) or Workflow so it
  survives outside a single request's CPU budget, with retries.

### 6.7 ❓ `validate-meeting-audio.ts` appears orphaned
- `validateMeetingAudio(file)` (line 4) checks MIME type
  (`audio/mpeg|wav|mp4|ogg`) and a 100MB max size, but is **not referenced** by
  `meeting-transcription.routes.ts` or any other route.
- **Action needed**: either wire this into a manual-upload route (if one is planned)
  or remove it if the upload path is no longer needed.

---

## 7. Suggested next steps (priority order)

1. Wire `transcribeRecording`'s output into the new `meetings` /
   `meetingTranscriptSegments` / `meetingSummaries` tables (§6.2–6.4) — this is the
   core of the speech-to-text pivot.
2. Decide on and implement an actual noise-suppression strategy (§6.1) — client-side
   `audioCaptureDefaults`/Krisp is the cheapest first step.
3. ~~Verify LiveKit webhook signatures (§6.5)~~ — done.
4. Move Chimege polling + R2 download off the request path (§6.6) — needed before
   relying on this for real meeting lengths.
5. Resolve or remove `validate-meeting-audio.ts` (§6.7).
