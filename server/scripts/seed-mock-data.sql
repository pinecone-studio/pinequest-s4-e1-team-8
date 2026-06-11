-- Local-only seed data: a workspace, the dev user (user_wr), and a mock project
-- "Mazaalai" owned by that user — ready to connect GitHub PAT/repo + Asana in the UI.
-- Apply with:
--   cd server && bunx wrangler d1 execute server-preset-db --local --file ./scripts/seed-mock-data.sql

INSERT OR REPLACE INTO workspaces (id, name, slug, created_at, updated_at)
VALUES ('ws_mock', 'Mock Workspace', 'mock-workspace', strftime('%s','now'), strftime('%s','now'));
--> statement-breakpoint
INSERT OR REPLACE INTO users (id, clerk_id, email, name, created_at, updated_at)
VALUES ('user_wr', 'clerk_user_wr', 'dev@brisk.local', 'Dev User', strftime('%s','now'), strftime('%s','now'));
--> statement-breakpoint
INSERT OR REPLACE INTO projects
  (id, workspace_id, owner_id, name, description, timezone,
   github_connected, asana_connected, is_github_disconnected, is_asana_disconnected,
   invite_token, created_at, updated_at)
VALUES
  ('proj_mazaalai', 'ws_mock', 'user_wr', 'Mazaalai',
   'Mock project for testing GitHub + Asana integrations', '(GMT+00:00) UTC',
   0, 0, 0, 0, 'mazaalai-demo', strftime('%s','now'), strftime('%s','now'));
