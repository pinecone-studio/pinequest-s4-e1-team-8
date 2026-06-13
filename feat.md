# Brisk — Meeting Feature Pages & Frontend Audit

## 1. Required frontend pages (driven by the current backend)

Backend surface (mounted in `server/src/index.ts`): `/users`, `/api/meeting-transcription`, `/api/meeting-room`, `/api/meetings`, `/api/voice`, `/api/webhooks`.

1. **Home/Dashboard (`/`)** — list the user's meetings (status, title, date) + "New meeting" CTA.
   ⚠️ **Gap**: there's no `GET /api/meetings` list endpoint, only `/:id/details`. You'll need a small new backend endpoint (list meetings by `userId`, ideally with latest transcription status + summary preview) before this page can be real.
2. **New/Join Meeting (`/meeting` or `/meeting/new`)** — room-name form → `POST /api/meeting-room/create`, or join via `/join`.
3. **Live Meeting Room (`/meeting/[roomName]`)** — LiveKit audio/video UI, voice-verification gate, live participant list (`/:roomName/participants`), start/stop recording (`start-egress`/`stop-egress`).
4. **Meeting Details / Notes (`/meetings/[id]`)** — summary, action items, diarized transcript, polling transcription status. (Already built per earlier work in this session.)
5. **Voice ID settings (`/settings/voice` or similar)** — enroll/verify, backed by `/api/voice/*`. (Form already exists.)
6. **Auth (login/signup)** — via Clerk, presumably already in place.

---

## 2. Frontend audit

Legend: ✅ real & backend-wired · 🔶 built but mock-data / partial · ❌ missing (404) · 🗑️ orphaned (calls a backend that no longer exists)

### 2.1 Status per planned page

**1. Home/Dashboard → `client/app/dashboard/page.tsx`** 🔶
Fully built UI (stat cards, "Live now", "Up next", action items, team activity, recent recordings), but **100% driven by `@/lib/mock-data`** (`meetings`, `recordings`, `actionItems`, `activity`, `currentUser`).
- Blocked on the `GET /api/meetings` list endpoint (gap above) for the meetings-related cards.
- "Action items" and "Team activity" have **no backend equivalent at all** in the current schema (`users`, `meetings`, `meetingTranscriptions`, `meetingSummaries`, `meetingTranscriptSegments`). These came from the pre-pivot project-management product. Either drop these cards, or derive a substitute (e.g. action items aggregated from `meetingSummaries.actionItems` across the user's meetings — there's no cross-team activity feed equivalent at all).

**2. New/Join Meeting → `client/app/meeting/page.tsx` + `meeting-room-form.tsx`** ✅ Done
- ✅ Real & backend-wired: `MeetingRoomForm` → `joinMeetingRoom` / `createMeetingRoom` (`POST /api/meeting-room/join-room` & `/create`), gated by `MeetingVoiceGate` (`/api/voice/*`).
- ✅ The no-room state is now a "Start a meeting" form with a single "Meeting title" input. Submitting slugifies the title (new `utils/slugify-room-name.ts`) into `meetingId`, navigates to `/meeting?meetingId=<slug>&roomName=<title>`, and reuses the existing display-name → join/create flow (`joinMeetingRoom` with fallback to `createMeetingRoom` → `POST /api/meeting-room/create`). The dashboard's "Start meeting" and `/meetings`' "New meeting" CTAs (`/meeting` with no params) land directly on this ad-hoc input instead of a channel picker. `page.tsx` no longer looks up `predefinedMeetingRooms`; that static list remains only as deep-link targets in the sidebar (`meeting-sidebar-section.tsx`), untouched by this change.

**3. Live Meeting Room → `client/app/meeting/components/livekit-room-view.tsx`** ✅ Done
Fully implemented: mic/camera/screen-share controls, participant tiles, live participant presence (via `meeting-session-provider` + sidebar), recording controls wired to `start-egress`/`stop-egress`, in-room chat over LiveKit's data channel (no extra backend needed), voice-verification gate. This is the most complete piece of the plan. (It's `/meeting?meetingId=&roomName=` rather than a `/meeting/[roomName]` dynamic route, but functionally equivalent.)

**4. Meeting Details / Notes → `client/app/meetings/[id]/page.tsx`** 🔶 Hybrid
- Header/status badge/participants/description come from **mock** `getMeetingByIdSync(id)`, which calls `notFound()` if the id isn't one of the 9 hardcoded mock meetings — **a real meeting id created via the backend currently 404s on this page.**
- ✅ The "AI meeting analysis" section uses the real `MeetingAnalysisPanel` (polls `/api/meetings/:id/details` + `/api/meeting-transcription/:id`) — this part is done.
- Needs: replace the mock header/`notFound()` gate with a real fetch (once the list/details endpoints exist) so real meetings render at all.

**5. Voice ID settings → `client/app/settings/page.tsx`** ✅ Done
- ✅ New `/settings` page (standard dashboard layout: header + `Card`) embeds `VoiceVerificationForm` via a new `variant="embedded"` prop that skips the full-screen `AuthShell` wrapper. The form's existing enroll/verify mode detection (`getVoiceStatus`) handles re-enrollment vs. verification, giving users a real post-onboarding place to manage their Voice ID, wired to `/api/voice/*`.
- ✅ `client/app/onboarding/page.tsx` still renders `VoiceVerificationForm` (default `variant="page"`) in enroll mode for first-time setup — unchanged.
- ✅ `client/app/voice-test/page.tsx` remains a real dev harness for `/api/voice/verify`.
- The sidebar's "Settings" link (`/settings`) now resolves. "Profile" (`/profile`) still has no page — not addressed in this pass (see 2.2).

**6. Auth → `/sign-in`, `/sign-up`** ✅ Done (Clerk).

### 2.2 Navigation / shell issues

- ✅ `components/dashboard/sidebar.tsx` (rendered via `DashboardAppShell`) now lists nav items **Dashboard, Meetings, Recordings** (`lib/nav-items.ts`) — the `/notes` and `/teams` entries (and their unused `NotebookTextIcon`/`UsersIcon` imports) were removed since neither page exists. `BottomNav` derives from the same array, so it's fixed too.
- ✅ Footer link **Settings** (`/settings`) now resolves to the new Voice ID settings page (2.1.5).
- ❌ Footer link **Profile** (`/profile`) still has no `page.tsx` — clicking it 404s. Not addressed in this pass.
- ✅ `DashboardAppShell`'s dead `scrollableMain` check for `pathname === "/tasks"` and `IMMERSIVE_ROUTE` regex for `/meetings/[id]/room` (neither route ever existed) have been removed — the shell is now a single unconditional sidebar/topbar/bottom-nav layout.

### 2.3 Orphaned pre-pivot code (🗑️ "useless" relative to the current backend) — ✅ Resolved

Commit `3cd22d9` ("Deleting files (#298)", 2026-06-12) ripped out a large chunk of an earlier **AI project-management product** (onboarding wizard with projects/tasks, GitHub/Asana sync, AI agent runner, analytics, calendar) from the server. `server/src/index.ts` mounts **only** `/users`, `/api/meeting-transcription`, `/api/meeting-room`, `/api/meetings`, `/api/voice`, `/api/webhooks` — there is no `/tasks`, `/api/backend/projects/*`, `/api/run-agent`, or `/integrations/*` route anywhere in `server/src`.

✅ The client-side dead cluster that called these now-dead endpoints has been removed in full — see plan item 7 for the complete file list (~30 files/directories: `lib/api/{tasks,projects,agent,agent-stream-url}.ts`, `lib/integrations/*`, `lib/tasks/*`, `lib/tiptap/*`, `lib/analytics/*`, `lib/onboarding/*` + `lib/onboarding-storage.ts`/`lib/onboarding-draft-storage.ts`, 6 onboarding/agent hooks, `services/integrations.ts`, `app/lib/google-docs.ts` (+test), and 10 orphaned `app/api/*` OAuth/tiptap/onboarding routes plus the now-empty `app/api/` directory). Confirmed via dependency-graph tracing that this was a single closed, mutually-referencing cluster with zero references from any live page/layout/component.

✅ `client/app/recordings/*` — resolved by folding into meetings (plan item 6): `/recordings` now reads from the same `GET /api/meetings` list as `/meetings`, filtered to `transcriptionStatus` `"done"`/`"processing"`, and `/recordings/[id]` was removed (cards link to `/meetings/[id]` instead).

---

## 3. Plan

1. ✅ **Add `GET /api/meetings` list endpoint** (by `userId`, with latest transcription status + summary preview) — unblocks the dashboard and meetings list. Implemented in `server/src/controllers/meetings/get-meetings.ts`, mounted at `meetingsRouter.get("/", getMeetings)`.
2. ✅ **Rewire `/meetings/[id]` header** off mock data onto the real meeting (remove the `notFound()`-on-mock gate). New `MeetingDetailHeader` client component fetches `fetchMeetingAnalysisDetails(meetingId)` (the same endpoint `MeetingAnalysisPanel` already used) and renders title/transcription-status badge/created date/participant names/"Rejoin room"; shows a "Meeting not found" card on error instead of a hard 404.
3. ✅ **Rewire `/meetings` list and `/dashboard`** onto the new list endpoint via `fetchMeetings()`. `/meetings` now filters by transcription status (Ready/Processing/Pending/Failed/No recording) instead of the old ongoing/upcoming/ended/canceled enum. `/dashboard` now shows real stats (total/ready/in-progress/failed), a "Recent meetings" list, and a "Recent recordings" list sourced from real meetings; dropped the mock-only "Live now", "Action items", and "Team activity" cards (no backend source exists for these). Removed the now-dead `meeting-card.tsx`, `schedule-meeting-dialog.tsx`, `dashboard-action-items.tsx`, `participant-avatars.tsx`, `lib/meetings/format.ts`, and `getMeetingByIdSync`.
4. ✅ **Reconcile `/meeting` "New/Join" flow** with plan item 2. Removed the `predefinedMeetingRooms` lookup from `client/app/meeting/page.tsx` — `selectedRoom` now comes purely from `meetingId`/`roomName` query params (still supports "Rejoin room" and sidebar channel deep-links). `MeetingRoomForm`'s no-room state is now a "Start a meeting" form (single "Meeting title" input); on submit the title is slugified (new `client/app/meeting/utils/slugify-room-name.ts`) and the page navigates to `/meeting?meetingId=<slug>&roomName=<title>`, re-entering the existing display-name → `joinSelectedRoom` flow which hits `POST /api/meeting-room/create` on the create fallback. Dashboard's "Start meeting" / `/meetings`' "New meeting" CTAs already link to plain `/meeting`, so they land on this ad-hoc input directly.
5. ✅ **Resolve `/notes`, `/teams`, `/settings`** — Removed `/notes` and `/teams` from `client/lib/nav-items.ts` (and their unused icon imports); `Sidebar`/`BottomNav` both derive from this array, so both surfaces are pruned. Removed `DashboardAppShell`'s dead `scrollableMain` (`/tasks`) check and `IMMERSIVE_ROUTE` (`/meetings/[id]/room`) regex/branch (`client/components/dashboard-app-shell.tsx`) — now a single unconditional layout. Added `client/app/settings/page.tsx` (standard dashboard layout + `Card`) embedding `VoiceVerificationForm` via a new `variant="embedded"` prop (`client/components/auth/voice-verification-form.tsx`) that skips the `AuthShell` full-page wrapper; enroll/verify mode is auto-detected via the existing `getVoiceStatus()` call. `/profile` still has no page and remains open.
6. ✅ **Fold `/recordings` into meetings**. `client/app/recordings/page.tsx` now calls `fetchMeetings()` (the same `GET /api/meetings` list endpoint used by `/meetings`/`/dashboard`) and filters to meetings whose `transcriptionStatus` is `"done"` or `"processing"`, rendering each via the shared `MeetingListCard` (status badge, date, summary preview, "Details" link to `/meetings/${id}`). Added a 3-pill filter (All/Ready/Processing) plus loading-skeleton and empty states matching the `/meetings` pattern. Removed `client/app/recordings/[id]/page.tsx` (redundant now that cards link to `/meetings/[id]`), the mock `Recording`/`RecordingStatus`/`RecordingSource`/`ProcessingStage`/`TranscriptEntry` types (`client/types/recording.ts`), the `recordings` mock array + `getRecordingByIdSync` from `lib/mock-data.ts`, the matching `getRecordings`/`getRecording`/`completeRecording`/`PROCESSING_STAGES` exports from `lib/mock-api.ts`, and the now-unreferenced `client/components/recordings/*` (recording-card, recording-action-items, recording-transcript, upload-recording-dialog) and `client/components/shared/action-item-list.tsx`.
7. ✅ **Dead-code pass**. Confirmed and removed the entire orphaned pre-pivot project-management cluster (~30 files/directories), all mutually-referencing and zero-imported by any live page/layout/component: `lib/api/{tasks,projects,agent,agent-stream-url}.ts`, `lib/integrations/` (asana.ts, github.ts), `lib/tasks/` (map-api-task.ts), `lib/tiptap/` (constants.ts, tdd-editor-extensions.ts), `lib/analytics/` (types.ts), `lib/onboarding/*` (8 files), `lib/onboarding-storage.ts`, `lib/onboarding-draft-storage.ts`, hooks `use-onboarding-data.ts`, `use-project-milestones.ts`, `use-essential-resources.ts`, `use-analytics-risks.ts`, `useBriskAgent.ts`, `useAgentStream.ts`, `services/integrations.ts`, `app/lib/google-docs.ts` (+test), and 10 orphaned `app/api/*` routes (asana/google/google-calendar OAuth, tiptap agent/ai-token/collab-token, onboarding export-google-doc) plus the now-empty `app/api/` directory. This fixed 25 of the 27 pre-existing `bunx tsc --noEmit` errors — the remaining 2 (in `meeting-sidebar-section.tsx`/`active-meeting-return-card.tsx`, referencing `@/components/sidebar/sidebar-context`) are pre-existing and unrelated. `bunx eslint .` is clean across the whole client.
