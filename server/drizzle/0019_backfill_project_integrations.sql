-- Best-effort backfill: copy each user's existing integration onto the project(s)
-- they own. A user owning multiple projects copies the same creds onto each; a
-- user owning zero projects (or NULL owner) is skipped automatically.
UPDATE projects SET
  github_pat = (SELECT gi.access_token FROM github_integrations gi WHERE gi.user_id = projects.owner_id),
  github_login = (SELECT gi.github_login FROM github_integrations gi WHERE gi.user_id = projects.owner_id),
  repo_owner = (SELECT gi.repo_owner FROM github_integrations gi WHERE gi.user_id = projects.owner_id),
  repo_name = (SELECT gi.repo_name FROM github_integrations gi WHERE gi.user_id = projects.owner_id),
  github_project_id = (SELECT gi.github_project_id FROM github_integrations gi WHERE gi.user_id = projects.owner_id),
  github_connected = 1,
  github_connected_by = projects.owner_id
WHERE projects.owner_id IN (SELECT user_id FROM github_integrations);
--> statement-breakpoint
UPDATE projects SET
  asana_access_token = (SELECT ai.access_token FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_refresh_token = (SELECT ai.refresh_token FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_token_expires_at = (SELECT ai.token_expires_at FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_user_gid = (SELECT ai.asana_user_gid FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_user_name = (SELECT ai.asana_user_name FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_user_email = (SELECT ai.asana_user_email FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_workspace_gid = (SELECT ai.workspace_gid FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_project_gid = (SELECT ai.project_gid FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_project_name = (SELECT ai.project_name FROM asana_integrations ai WHERE ai.user_id = projects.owner_id),
  asana_connected = 1,
  asana_connected_by = projects.owner_id
WHERE projects.owner_id IN (SELECT user_id FROM asana_integrations);
