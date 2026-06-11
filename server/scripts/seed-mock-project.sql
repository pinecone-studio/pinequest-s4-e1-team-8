-- Local-only seed: a mock project you own, ready to connect GitHub PAT/repo + Asana.
-- Apply with:
--   cd server && bunx wrangler d1 execute server-preset-db --local --file ./scripts/seed-mock-project.sql
--
-- The first block repairs a stale local `projects` table (adds columns that exist
-- on prod but were missing locally). Safe to run once; re-running the ALTERs will
-- error because the columns already exist — that is expected, just skip them.

ALTER TABLE `projects` ADD `owner_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `timezone` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `github_connected` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_connected` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_github_disconnected` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_asana_disconnected` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `invite_token` text;
