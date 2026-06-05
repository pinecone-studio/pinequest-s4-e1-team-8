-- Dev mock data (idempotent — safe to re-run locally)
DELETE FROM ai_messages;
DELETE FROM ai_conversations;
DELETE FROM tasks;
DELETE FROM sub_team_members;
DELETE FROM sub_teams;
DELETE FROM projects;
DELETE FROM members;
DELETE FROM workspaces;
DELETE FROM users;

-- Users (matches dashboard team avatars)
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

-- Projects (sidebar tree)
INSERT INTO projects (id, workspace_id, name, description, created_at, updated_at) VALUES
  ('proj_edu', 'ws_pinequest', 'Edu Design Landing', 'Marketing landing page for edu product', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_team', 'ws_pinequest', 'Team Project', 'Main team workspace project', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_tripple', 'ws_pinequest', 'Tripple Website', 'Multi-page marketing site', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_social', 'ws_pinequest', 'Social App', 'Mobile social features', strftime('%s', 'now'), strftime('%s', 'now')),
  ('proj_smart_home', 'ws_pinequest', 'Smart Home UI Ux', 'Last project from dashboard', strftime('%s', 'now'), strftime('%s', 'now'));

-- Sub-teams under Team Project
INSERT INTO sub_teams (id, project_id, name, created_at, updated_at) VALUES
  ('sub_website', 'proj_team', 'Website', strftime('%s', 'now'), strftime('%s', 'now')),
  ('sub_apps', 'proj_team', 'Apps', strftime('%s', 'now'), strftime('%s', 'now')),
  ('sub_dribbble', 'proj_team', 'Dribbble Shot', strftime('%s', 'now'), strftime('%s', 'now'));

INSERT INTO sub_team_members (id, sub_team_id, user_id, created_at) VALUES
  ('stm_1', 'sub_apps', 'user_sj', strftime('%s', 'now')),
  ('stm_2', 'sub_apps', 'user_wr', strftime('%s', 'now')),
  ('stm_3', 'sub_website', 'user_mr', strftime('%s', 'now')),
  ('stm_4', 'sub_dribbble', 'user_ak', strftime('%s', 'now'));

-- Tasks (task page — mirrors client/components/tasks/mock-tasks.ts)
INSERT INTO tasks (
  id, workspace_id, project_id, sub_team_id, assignee_id, parent_id,
  title, description, status, priority,
  source, tool, due_date, progress, blocked, done_count, blocked_count, time_left, members_json,
  created_at, updated_at
) VALUES
  ('github-1', 'ws_pinequest', 'proj_team', 'sub_apps', 'user_wr', NULL, 'Backend Team', 'GitHub project issue sample', 'IN_PROGRESS', 'HIGH', 'github', 'Python', '2026-06-11', 80, 0, 12, 7, '1 Week Left', '["MG","SC","IP","LF"]', strftime('%s', 'now'), strftime('%s', 'now')),
  ('github-2', 'ws_pinequest', 'proj_team', 'sub_apps', 'user_sj', NULL, 'Front End Team', 'GitHub project issue sample', 'IN_PROGRESS', 'MEDIUM', 'github', 'React', '2026-06-18', 70, 1, 8, 6, '2 Weeks Left', '["NH","EM","KB"]', strftime('%s', 'now'), strftime('%s', 'now')),
  ('asana-1', 'ws_pinequest', 'proj_team', 'sub_website', 'user_mr', NULL, 'UX UI Team', 'Asana task sample', 'DONE', 'MEDIUM', 'asana', 'Figma', '2026-06-09', 90, 0, 14, 4, '5 Days Left', '["RS","MI","JP"]', strftime('%s', 'now'), strftime('%s', 'now')),
  ('asana-2', 'ws_pinequest', 'proj_team', NULL, 'user_ak', NULL, 'Marketing Team', 'Asana task sample', 'IN_PROGRESS', 'LOW', 'asana', 'Notion', '2026-06-13', 40, 0, 19, 10, '1 Week Left', '["UF","TR"]', strftime('%s', 'now'), strftime('%s', 'now')),
  ('internal-1', 'ws_pinequest', 'proj_team', 'sub_apps', 'user_wr', NULL, 'Product Ops', 'Internal Brisk task', 'TODO', 'URGENT', 'internal', 'Internal', '2026-06-07', 35, 1, 5, 9, '3 Days Left', '["BA","OD","TU"]', strftime('%s', 'now'), strftime('%s', 'now')),
  ('internal-2', 'ws_pinequest', 'proj_team', 'sub_dribbble', 'user_ak', NULL, 'QA Release', 'Internal Brisk task', 'IN_PROGRESS', 'HIGH', 'internal', 'Checklist', '2026-06-15', 65, 0, 11, 3, '10 Days Left', '["QA","ER","PM"]', strftime('%s', 'now'), strftime('%s', 'now'));

-- AI conversation (onboarding-style)
INSERT INTO ai_conversations (id, workspace_id, user_id, title, created_at, updated_at) VALUES
  ('conv_onboarding', 'ws_pinequest', 'user_wr', 'Project setup assistant', strftime('%s', 'now'), strftime('%s', 'now'));

INSERT INTO ai_messages (id, conversation_id, sender, content, created_at) VALUES
  ('msg_1', 'conv_onboarding', 'USER', 'Help me break down our Smart Home UI project into tasks.', strftime('%s', 'now')),
  ('msg_2', 'conv_onboarding', 'AI', 'Suggested phases: Research, Wireframe, UI Design, Prototype, then A/B Test before launch.', strftime('%s', 'now')),
  ('msg_3', 'conv_onboarding', 'SYSTEM', 'Tasks synced to project board.', strftime('%s', 'now'));
