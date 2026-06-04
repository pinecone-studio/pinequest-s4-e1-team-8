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
