-- Dev mock data (idempotent — safe to re-run locally)
-- Relative dates use SQLite modifiers so risks/weekly charts stay meaningful over time.

DELETE FROM ai_messages;
DELETE FROM ai_conversations;
DELETE FROM tasks;
DELETE FROM sub_team_members;
DELETE FROM sub_teams;
DELETE FROM projects;
DELETE FROM members;
DELETE FROM workspaces;
DELETE FROM users;

-- Users
INSERT INTO users (id, clerk_id, email, name, avatar_url, created_at, updated_at) VALUES
  ('user_wr', 'clerk_wr', 'wilson.reed@pinequest.dev', 'Wilson Reed', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
  ('user_mr', 'clerk_mr', 'maya.rivera@pinequest.dev', 'Maya Rivera', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
  ('user_sj', 'clerk_sj', 'sarah.jones@pinequest.dev', 'Sarah Jones', NULL, strftime('%s', 'now'), strftime('%s', 'now')),
  ('user_ak', 'clerk_ak', 'alex.kim@pinequest.dev', 'Alex Kim', NULL, strftime('%s', 'now'), strftime('%s', 'now'));

-- Workspace
INSERT INTO workspaces (id, name, slug, created_at, updated_at) VALUES
  ('ws_pinequest', 'Pinequest Team', 'pinequest-team', strftime('%s', 'now'), strftime('%s', 'now'));

-- Members
INSERT INTO members (id, user_id, workspace_id, role, created_at, updated_at) VALUES
  ('mem_wr', 'user_wr', 'ws_pinequest', 'OWNER', strftime('%s', 'now'), strftime('%s', 'now')),
  ('mem_mr', 'user_mr', 'ws_pinequest', 'ADMIN', strftime('%s', 'now'), strftime('%s', 'now')),
  ('mem_sj', 'user_sj', 'ws_pinequest', 'MEMBER', strftime('%s', 'now'), strftime('%s', 'now')),
  ('mem_ak', 'user_ak', 'ws_pinequest', 'MEMBER', strftime('%s', 'now'), strftime('%s', 'now'));

-- Projects
INSERT INTO projects (id, workspace_id, name, description, created_at, updated_at) VALUES
  ('proj_edu', 'ws_pinequest', 'Edu Design Landing', 'Marketing landing page for edu product', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_team', 'ws_pinequest', 'Team Project', 'Main team workspace project', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_tripple', 'ws_pinequest', 'Tripple Website', 'Multi-page marketing site', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_social', 'ws_pinequest', 'Social App', 'Mobile social features', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_smart_home', 'ws_pinequest', 'Smart Home UI Ux', 'Last project from dashboard', strftime('%s', 'now'), strftime('%s', 'now'));

-- Sub-teams
INSERT INTO sub_teams (id, project_id, name, created_at, updated_at) VALUES
  ('sub_website', 'proj_team', 'Website', strftime('%s', 'now'), strftime('%s', 'now')),
  ('sub_apps', 'proj_team', 'Apps', strftime('%s', 'now'), strftime('%s', 'now')),
  ('sub_dribbble', 'proj_team', 'Dribbble Shot', strftime('%s', 'now'), strftime('%s', 'now'));

INSERT INTO sub_team_members (id, sub_team_id, user_id, created_at) VALUES
  ('stm_1', 'sub_apps', 'user_sj', strftime('%s', 'now')),
  ('stm_2', 'sub_apps', 'user_wr', strftime('%s', 'now')),
  ('stm_3', 'sub_website', 'user_mr', strftime('%s', 'now')),
  ('stm_4', 'sub_dribbble', 'user_ak', strftime('%s', 'now'));

-- Tasks — tuned for analytics (summary, risks, weekly)
-- created_at / updated_at spread across last 7 days for weekly chart
INSERT INTO tasks (
  id, workspace_id, project_id, sub_team_id, assignee_id, parent_id,
  title, description, status, priority,
  source, tool, due_date, progress, blocked, done_count, blocked_count, time_left, members_json,
  created_at, updated_at
) VALUES
  -- GitHub (2 active, 1 blocked)
  ('github-1', 'ws_pinequest', 'proj_team', 'sub_apps', 'user_wr', NULL,
   'Backend Team', 'API and auth integration', 'IN_PROGRESS', 'HIGH',
   'github', 'Python', date('now', '+5 days'), 80, 0, 12, 7, '5 Days Left', '["MG","SC","IP","LF"]',
   strftime('%s', 'now', '-6 days'), strftime('%s', 'now', '-1 day')),

  ('github-2', 'ws_pinequest', 'proj_team', 'sub_apps', 'user_sj', NULL,
   'Front End Team', 'Dashboard and task board UI', 'IN_PROGRESS', 'MEDIUM',
   'github', 'React', date('now', '+3 days'), 70, 1, 8, 6, '3 Days Left', '["NH","EM","KB"]',
   strftime('%s', 'now', '-5 days'), strftime('%s', 'now')),

  ('github-3', 'ws_pinequest', 'proj_team', 'sub_website', 'user_mr', NULL,
   'GitHub Actions CI', 'Pipeline for deploy previews', 'TODO', 'HIGH',
   'github', 'GitHub', date('now', '+2 days'), 15, 0, 2, 1, '2 Days Left', '["CI","DV"]',
   strftime('%s', 'now', '-2 days'), strftime('%s', 'now', '-2 days')),

  -- Asana (1 done, 1 in progress)
  ('asana-1', 'ws_pinequest', 'proj_team', 'sub_website', 'user_mr', NULL,
   'UX UI Team', 'Design system and wireframes', 'DONE', 'MEDIUM',
   'asana', 'Figma', date('now', '-2 days'), 100, 0, 14, 4, 'Done', '["RS","MI","JP"]',
   strftime('%s', 'now', '-6 days'), strftime('%s', 'now', '-3 days')),

  ('asana-2', 'ws_pinequest', 'proj_team', NULL, 'user_ak', NULL,
   'Marketing Team', 'Launch blog and social posts', 'IN_PROGRESS', 'LOW',
   'asana', 'Notion', date('now', '+6 days'), 40, 0, 19, 10, '6 Days Left', '["UF","TR"]',
   strftime('%s', 'now', '-4 days'), strftime('%s', 'now', '-1 day')),

  -- Internal (urgent + blocked, overdue, slow progress)
  ('internal-1', 'ws_pinequest', 'proj_team', 'sub_apps', 'user_wr', NULL,
   'Product Ops', 'Sprint planning and backlog grooming', 'TODO', 'URGENT',
   'internal', 'Internal', date('now', '+1 days'), 35, 1, 5, 9, '1 Day Left', '["BA","OD","TU"]',
   strftime('%s', 'now', '-3 days'), strftime('%s', 'now')),

  ('internal-2', 'ws_pinequest', 'proj_team', 'sub_dribbble', 'user_ak', NULL,
   'QA Release', 'Regression before demo', 'IN_PROGRESS', 'HIGH',
   'internal', 'Checklist', date('now', '+4 days'), 65, 0, 11, 3, '4 Days Left', '["QA","ER","PM"]',
   strftime('%s', 'now', '-1 day'), strftime('%s', 'now')),

  ('internal-3', 'ws_pinequest', 'proj_team', 'sub_apps', 'user_sj', NULL,
   'Analytics API', 'Summary, risks, and weekly endpoints', 'IN_PROGRESS', 'URGENT',
   'internal', 'TypeScript', date('now', '-1 days'), 25, 0, 3, 0, 'Overdue', '["AK","MR"]',
   strftime('%s', 'now', '-5 days'), strftime('%s', 'now')),

  ('internal-4', 'ws_pinequest', 'proj_team', NULL, 'user_wr', NULL,
   'Docs & Onboarding', 'Update README and env setup guide', 'BACKLOG', 'LOW',
   'internal', 'Markdown', date('now', '+14 days'), 0, 0, 0, 0, '2 Weeks Left', '["WR"]',
   strftime('%s', 'now'), strftime('%s', 'now'));

-- AI conversation
INSERT INTO ai_conversations (id, workspace_id, user_id, title, created_at, updated_at) VALUES
  ('conv_onboarding', 'ws_pinequest', 'user_wr', 'Project setup assistant', strftime('%s', 'now'), strftime('%s', 'now'));

INSERT INTO ai_messages (id, conversation_id, sender, content, created_at) VALUES
  ('msg_1', 'conv_onboarding', 'USER', 'Help me break down our Smart Home UI project into tasks.', strftime('%s', 'now')),
  ('msg_2', 'conv_onboarding', 'AI', 'Suggested phases: Research, Wireframe, UI Design, Prototype, then A/B Test before launch.', strftime('%s', 'now')),
  ('msg_3', 'conv_onboarding', 'SYSTEM', 'Tasks synced to project board.', strftime('%s', 'now'));
