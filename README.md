# Brisk

> Internal name: **PineQuest** · Repo: `pinequest-s4-e1-team-8`

Brisk is an AI-powered project management platform. You describe a project in plain language and an AI agent breaks it down into a structured plan (workspaces, tasks, risks), then helps you run the work: task boards, analytics, live meetings with transcription, and two-way sync with GitHub and Asana.

## Tech stack

| Layer    | Stack |
|----------|-------|
| **Client** (`client/`) | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4 + shadcn/ui, Clerk auth, deployed to Cloudflare via OpenNext |
| **Server** (`server/`) | Cloudflare Worker, Hono 4, Drizzle ORM + D1 (SQLite), Clerk backend auth |
| **AI**     | LangChain / LangGraph multi-agent pipeline on Google Gemini; Groq (`llama-3.1-8b-instant`) for lighter calls |
| **Realtime** | LiveKit (meeting rooms + egress recording), R2 for recording storage, transcription pipeline |
| **Tooling** | Bun (package manager + runtime), Wrangler, Drizzle Kit |

It's a **Bun monorepo** with two workspaces, `client` and `server`, wired through the root `package.json`.

## Repository layout

```
.
├── client/                 # Next.js frontend (deployed as a Cloudflare Worker via OpenNext)
│   ├── app/                # App Router routes: dashboard, onboarding, analytics,
│   │                       #   meeting, agent-workspace, invite/[token], login, progress …
│   ├── components/         # Shared UI (incl. onboarding/ drag-and-drop canvas)
│   ├── features/           # Feature modules
│   ├── hooks/  lib/  services/  public/
│   └── scripts/            # CF deploy helpers (deploy-production.mjs, fix-standalone-deps.mjs …)
│
├── server/                 # Hono API on Cloudflare Workers
│   └── src/
│       ├── index.ts        # Hono app + CORS + route registration (API surface)
│       ├── routes/         # Route definitions, one folder per domain
│       ├── controllers/    # Request handlers
│       ├── services/       # External integrations (e.g. github/)
│       ├── lib/            # auth, crypto, gemini, groq, github, asana, analytics, risk …
│       ├── agent/          # LangGraph agent (nodes/, onboarding-discovery/ + CLI)
│       ├── db/  schema/    # Drizzle schema
│       └── ...
│   └── wrangler.jsonc      # Worker config, D1 binding, vars
│
├── scripts/test-agent.ts   # Agent smoke test (root)
├── package.json            # Workspace root + top-level scripts
└── CLAUDE.md               # Agent/dev conventions (Bun-first)
```

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.3 (project developed on 1.3.14)
- A Cloudflare account with access to the `brisk` D1 database (for remote work)
- Accounts/keys for: Clerk, Google Gemini, Groq, LiveKit, and (optional) GitHub + Asana integrations

## Getting started

```bash
# from the repo root
bun install
```

### Environment variables

Secrets are **not** committed. Create the following local files (the build also reads them in dev):

- `server/.dev.vars` — Worker secrets for `wrangler dev`
- `client/.env` — frontend variables

**Server (`server/.dev.vars`)** — keys referenced by the code:

```
CLERK_SECRET_KEY=...
GEMINI_API_KEY=...
GROQ_API_KEY=...
ENCRYPTION_KEY=...              # used to encrypt stored integration credentials
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
R2_ACCESS_KEY_ID=...            # R2_* used for meeting-recording storage
R2_SECRET_ACCESS_KEY=...
GITHUB_...                      # GitHub App / token vars for integration + webhooks
ASANA_...                       # Asana OAuth vars for integration
```

Non-secret vars (D1 name, LiveKit URL, Clerk publishable key, client/frontend URLs, `GROQ_MODEL`) live in `server/wrangler.jsonc` under `vars`.

**Client (`client/.env`)** — Clerk publishable key, the server API base URL, and any other public config.

> Check the existing `.dev.vars` / `.env` on a working machine for the exact, current set of keys — the list above is derived from code usage and may not be exhaustive.

### Run locally

```bash
# Server (Hono on Wrangler) — http://localhost:8787
bun run dev:server

# Client (Next.js) — http://localhost:3000
bun run dev:client
```

The server CORS allow-list includes `localhost:3000–3003` plus the deployed client origin, so the local client talks to the local server out of the box.

## Database (D1 + Drizzle)

Run from `server/`:

```bash
bun run db:generate          # generate migrations from Drizzle schema
bun run db:migrate:local     # apply migrations to the local D1
bun run db:seed:local        # seed local data
bun run db:setup:local       # migrate + seed in one step
bun run db:migrate:remote    # apply migrations to the remote `brisk` D1
```

- Local binding/db name: `server-preset-db`
- Remote (production) D1 name: `brisk` (same `database_id`), selected via the `production` env in `wrangler.jsonc`

## API surface

The Hono app (`server/src/index.ts`) mounts these route groups:

| Path | Purpose |
|------|---------|
| `/users`, `/projects`, `/tasks` | Core CRUD |
| `/integrations/github`, `/integrations/asana` | Connect external trackers |
| `/api/integrations/sync-task` | Task sync between Brisk ↔ GitHub/Asana |
| `/analytics`, `/api/analytics` | Project analytics & metrics |
| `/api/agent`, `/api/agent/stream`, `/api/run-agent` | AI agent (incl. streaming) |
| `/api/onboarding/scoping` · `/chat` · `/refine-selection` · `/sessions` · `/api/onboarding` | Onboarding discovery → provisioning flow |
| `/api/projects/initialize`, `/api/projects/create-lean` | Project bootstrapping |
| `/api/reports/stream` | Streaming report generation |
| `/api/meeting-room`, `/api/meeting-transcription` | LiveKit rooms + transcription/egress webhook |
| `/api/webhooks` | Inbound webhooks (e.g. GitHub) |
| `/api/mappings`, `/api/tasks` (reorder) | ID mappings, task reordering |

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

## Type-checking & lint

```bash
# client/
bun run typecheck    # tsc --noEmit
bun run lint         # eslint
```

## Testing

```bash
bun run test:agent   # agent smoke test (scripts/test-agent.ts)
```

Per Bun conventions, use `bun test` for unit tests (`*.test.ts`).

## Notes & conventions

- **Bun-first.** Use `bun`/`bunx` rather than `node`/`npm`/`npx`. See `CLAUDE.md`.
- **Next.js 16 has breaking changes** vs. older versions — see `client/AGENTS.md`; consult `node_modules/next/dist/docs/` before writing client code.
- Integration credentials (GitHub/Asana) are **project-scoped**: stored encrypted on the `projects` table and shared by project members, so credentials applied by one member work for the whole team.
