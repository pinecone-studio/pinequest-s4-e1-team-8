-- Project-scoped integration credentials (shared by all project members).
-- Only the genuinely-new columns are added here; the prior drizzle snapshot was
-- stale, so the auto-generated table re-creations were dropped (they already exist).
ALTER TABLE `projects` ADD `github_pat` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `github_login` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `repo_owner` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `repo_name` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `github_project_id` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `github_connected_by` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_access_token` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_refresh_token` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_token_expires_at` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_user_gid` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_user_name` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_user_email` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_workspace_gid` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_project_gid` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_project_name` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_connected_by` text REFERENCES users(id);
