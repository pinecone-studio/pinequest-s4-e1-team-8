# Brisk

> Internal name: **PineQuest** · Repo: `pinequest-s4-e1-team-8`

Brisk is an AI-powered project management platform. You describe a project in plain language and an AI agent scopes it through a discovery chat, breaks it down into a structured plan (workspaces, milestones, tasks, risks), then helps you run the work: task boards, analytics and streaming reports, live meetings with recording + transcription, Google Calendar scheduling, and two-way task sync with GitHub and Asana. Sign-in is handled by Clerk, with optional **voice biometric verification** on top.

## Tech stack

| Layer | Stack |
|----------|-------|
| **Client** (`client/`) | Next.js 16 (App Router), React 19, Tailwind CSS 4 + shadcn/ui, Clerk auth, deployed to Cloudflare via OpenNext |
| **Server** (`server/`) | Cloudflare Worker, Hono 4, Drizzle ORM + D1 (SQLite), Clerk backend auth + Svix-verified Clerk webhooks |
| **AI** | LangChain / LangGraph multi-agent pipeline on Google Gemini; Groq (`llama-3.1-8b-instant`) for lighter calls |
| **Meetings** | LiveKit (rooms + egress recording), R2 for recording storage, Chimege + Groq transcription pipeline |
| **Voice sign-in** | Azure Speech speaker verification (~3–5 s enrollment), with a local fallback provider for keyless dev |
| **Integrations** | GitHub & Asana (two-way task sync), Google Calendar (OAuth via Next API routes) |
| **Tooling** | Bun (package manager + runtime), Wrangler, Drizzle Kit |

It's a **Bun monorepo** with two workspaces, `client` and `server`, wired through the root `package.json`.

## Repository layout

```
.
├── client/                 # Next.js frontend (deployed as a Cloudflare Worker via OpenNext)
│   ├── app/                # App Router routes: login, onboarding, dashboard, analytics,
│   │   │                   #   progress, meeting, meeting-summaries, agent-workspace,
│   │   │                   #   invite/[token], dev-preview-scoping …
│   │   └── api/            # Next API routes: Google Calendar CRUD + OAuth callbacks (Google, Asana)
│   ├── components/         # Shared UI (incl. auth/voice-verification-form, onboarding canvas)
│   ├── features/  hooks/  lib/  services/  public/
│   ├── next.config.ts      # Rewrites /api/backend/*, /analytics/*, /users/* … → the Worker API
│   └── scripts/            # CF deploy helpers (deploy-production.mjs, fix-standalone-deps.mjs …)
│
├── server/                 # Hono API on Cloudflare Workers
│   ├── src/
│   │   ├── index.ts        # Hono app + CORS + route registration (API surface)
│   │   ├── routes/         # Route definitions, one folder per domain (agent, onboarding,
│   │   │                   #   voice, meetingRoom, meetingTranscription, webhooks …)
│   │   ├── controllers/    # Request handlers (incl. Chimege transcription pipeline)
│   │   ├── services/       # GitHub / Asana sync services
│   │   ├── lib/            # auth, crypto, gemini, groq, github, asana, azure, voice,
│   │   │                   #   analytics, risk, onboarding …
│   │   ├── agent/          # LangGraph agents (briskGraph, nodes/, onboarding-discovery/ + CLI)
│   │   └── db/  schema/    # Drizzle schema: workspaces, projects, tasks, milestones, members,
│   │                       #   sub-teams, invite tokens, onboarding sessions, project risks,
│   │                       #   report snapshots, analytics metrics, integrations …
│   ├── drizzle/            # Generated SQL migrations
│   └── wrangler.jsonc      # Worker config, D1 binding, vars
│
├── scripts/test-agent.ts   # Agent smoke test (root)
├── package.json            # Workspace root + top-level scripts
└── CLAUDE.md               # Agent/dev conventions (Bun-first)
```

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- A Cloudflare account with access to the D1 database (for remote work)
- Accounts/keys for: Clerk, Google Gemini, Groq, LiveKit, Chimege (meeting transcription), and optionally Azure Speech (voice sign-in — falls back to a local provider without it), GitHub, Asana, and Google OAuth (calendar)

## Getting started

```bash
# from the repo root
bun install
```

### Environment variables

Secrets are **not** committed. Create the following local files:

- `server/.dev.vars` — Worker secrets for `wrangler dev`
- `client/.env` (or `.env.local`) — frontend variables, also loaded by `next.config.ts` in dev

**Server (`server/.dev.vars`)** — bindings declared in `src/lib/common/types.ts`:

```
# Auth
CLERK_SECRET_KEY=...
CLERK_WEBHOOK_SECRET=...            # Svix signing secret for /api/webhooks/clerk

# AI
GEMINI_API_KEY=...
GROQ_API_KEY=...                    # optional split keys: GROQ_GENERATIVE_API_KEY, GROQ_MEETING_API_KEY

# Meetings & transcription
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
CHIMEGE_API_KEY=...                 # speech-to-text (CHIMEGE_BASE_URL optional)
R2_ACCESS_KEY_ID=...                # R2_* used for meeting-recording storage
R2_SECRET_ACCESS_KEY=...

# Voice biometric sign-in
AZURE_SPEECH_KEY=...                # optional — see "Voice sign-in" below
AZURE_SPEECH_REGION=...
VOICE_VERIFICATION_MODE=...         # optional override: "azure" | "local"

# Integrations
ENCRYPTION_KEY=...                  # encrypts stored integration credentials
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_OAUTH_REDIRECT_URI=...
GITHUB_WEBHOOK_SECRET=...
ASANA_CLIENT_ID=...
ASANA_CLIENT_SECRET=...
```

Non-secret vars (D1 name, LiveKit URL, R2 account/bucket, Clerk publishable key, client URLs, `GROQ_MODEL`) live in `server/wrangler.jsonc` under `vars`.

**Client (`client/.env`)** — Clerk keys (read by `@clerk/nextjs`), the Worker API base (`LOCAL_API_URL` in dev, `API_URL`/`NEXT_PUBLIC_API_URL` in prod — defaults to `http://localhost:8787`), `NEXT_PUBLIC_LIVEKIT_URL`, `NEXT_PUBLIC_SERVER_URL`, Google OAuth (`GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`) for the calendar, and Asana OAuth vars for the integration callback.

> Check the existing `.dev.vars` / `.env` on a working machine for the exact, current set of keys — the list above is derived from code usage and may not be exhaustive.

### Run locally

```bash
# Server (Hono on Wrangler) — http://localhost:8787
bun run dev:server

# Client (Next.js) — http://localhost:3000
bun run dev:client
```

The server CORS allow-list includes `localhost:3000–3003` plus the deployed client origin, and the client rewrites `/api/backend/*` (and `/analytics/*`, `/users/*`, `/integrations/*`) to the Worker, so the local client talks to the local server out of the box.

## Database (D1 + Drizzle)

Run from `server/`:

```bash
bun run db:generate          # generate migrations from Drizzle schema
bun run db:migrate:local     # apply migrations to the local D1
bun run db:seed:local        # seed local data
bun run db:setup:local       # migrate + seed in one step
bun run db:migrate:remote    # apply migrations to the remote D1
bun run db:repair:local      # repair local schema drift (scripts/repair-local-schema.ts)
```

- Local binding/db name: `server-preset-db`
- Production D1 name: `brisk` (same `database_id`), selected via the `production` env in `wrangler.jsonc`

## API surface

The Hono app (`server/src/index.ts`) mounts these route groups:

| Path | Purpose |
|------|---------|
| `/users`, `/projects`, `/tasks` | Core CRUD |
| `/integrations/github`, `/integrations/asana` | Connect external trackers (OAuth) |
| `/api/integrations/sync-task` | Two-way task sync Brisk ↔ GitHub/Asana |
| `/analytics`, `/api/analytics` | Project analytics & metrics |
| `/api/agent`, `/api/agent/stream`, `/api/run-agent` | AI agent (incl. streaming) |
| `/api/onboarding/scoping` · `/chat` · `/refine-selection` · `/sessions` · `/api/onboarding` | Onboarding discovery → provisioning flow |
| `/api/projects/initialize`, `/api/projects/create-lean` | Project bootstrapping |
| `/api/reports/stream` | Streaming report generation |
| `/api/meeting-room`, `/api/meeting-transcription` | LiveKit rooms + transcription/egress webhook |
| `/api/voice` | Voice biometrics: `GET /status`, `POST /enroll`, `POST /verify` (Clerk-authenticated) |
| `/api/webhooks/github`, `/api/webhooks/clerk` | Inbound webhooks (GitHub events, Clerk user sync) |
| `/api/mappings`, `/api/tasks` | External-ID mappings, task reordering |

## Voice sign-in

After Clerk auth, users can enroll a short (~3–5 s) voice sample and verify by voice on later sign-ins (`client/components/auth/voice-verification-form.tsx`, proxied via `/api/backend/voice/*`). Provider selection (`server/src/lib/voice/voice-verification.service.ts`):

- **azure** — Azure Speech speaker-verification REST API; used when `AZURE_SPEECH_KEY`/`AZURE_SPEECH_REGION` are set.
- **local** — an offline signature-comparison fallback; used automatically when Azure keys are missing.
- `VOICE_VERIFICATION_MODE=azure|local` forces a provider explicitly.

## Build, preview & deploy

**Client** (from `client/`, or via root `bun run deploy:client`):

```bash
bun run build:cf     # next build (webpack) + standalone dep fix
bun run preview      # OpenNext build + local CF preview
bun run deploy:prod  # production deploy (scripts/deploy-production.mjs)
```

**Server** (from `server/`):

```bash
bun run deploy       # wrangler deploy --minify
```

Deployed targets:
- Client: `https://brisk-client.danny-otgontsetseg.workers.dev`
- Server: `https://server-preset.danny-otgontsetseg.workers.dev`

## Type-checking, lint & tests

```bash
# client/
bun run typecheck    # tsc --noEmit
bun run lint         # eslint

# repo root
bun test             # unit tests (onboarding-discovery graph/rubric, local voice verification …)
bun run test:agent   # agent smoke test (scripts/test-agent.ts)

# server/
bun run discovery:cli  # drive the onboarding-discovery agent from the terminal
```

## Notes & conventions

- **Bun-first.** Use `bun`/`bunx` rather than `node`/`npm`/`npx`. See `CLAUDE.md`.
- **Next.js 16 has breaking changes** vs. older versions — see `client/AGENTS.md`; consult `node_modules/next/dist/docs/` before writing client code.
- Integration credentials (GitHub/Asana) are **project-scoped**: stored encrypted on the `projects` table and shared by project members, so credentials applied by one member work for the whole team.
- Google Calendar tokens are held client-side in an httpOnly `gcal_token` cookie and refreshed by the Next API route — the Worker is not involved in calendar calls.
