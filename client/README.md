# Next.js client boilerplate (Axios with instance)

## 1. Purpose

This repository is a **Next.js** app boilerplate focused on a small **Axios** setup: a shared base URL and two instances so you can call your API consistently from the browser and from the server.

- **`clientApi`** — for client components / the browser (`withCredentials` for cookies).
- **`serverApi`** — async factory for server components / server actions; forwards the `token` cookie as a `Bearer` header when present.

Configuration lives in [`app/lib/api.ts`](app/lib/api.ts). Set `NEXT_PUBLIC_API_URL` in your environment (for example `.env.local`) to point at your backend.

## 2. Quick start

Install [Bun](https://bun.sh), then from the project root:

```bash
bun install
```

Axios is already listed in `package.json`. To add or upgrade it explicitly:

```bash
bun add axios
```

Create `.env.local` (not committed) with your API origin:

```bash
NEXT_PUBLIC_API_URL=https://your-api.example.com
```

Run the dev server:

```bash
bun run dev
```

Other scripts:

```bash
bun run build
bun run start
```

Open [http://localhost:3000](http://localhost:3000) in the browser.

## 3. Runtime: Bun, not Node.js

This project is intended to run in a **Bun** environment. The `package.json` scripts use `bun --bun` when invoking Next.js (`dev`, `build`, `start`), so day-to-day installs and the app lifecycle are **Bun-first** rather than a typical Node.js/npm workflow.

You can still use Node-compatible tooling where needed, but the documented path for this repo is: **install packages with `bun`, run scripts with `bun`**.

---

For Next.js behavior and APIs, see the [Next.js documentation](https://nextjs.org/docs). This template targets a recent Next.js major; check `package.json` for pinned versions.
