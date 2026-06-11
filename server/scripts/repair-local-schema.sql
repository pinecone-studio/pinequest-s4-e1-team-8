-- Idempotent repairs for local D1 when migrations were partially applied.

INSERT OR IGNORE INTO users (id, clerk_id, email, name, avatar_url, created_at, updated_at)
VALUES (
  'user_wr',
  'clerk_wr',
  'dev@brisk.local',
  'Dev User',
  NULL,
  strftime('%s', 'now'),
  strftime('%s', 'now')
);

CREATE TABLE IF NOT EXISTS `project_collaborators` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `asana_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text NOT NULL,
	`refresh_token` text,
	`token_expires_at` integer,
	`asana_user_gid` text,
	`asana_user_name` text,
	`asana_user_email` text,
	`workspace_gid` text,
	`project_gid` text,
	`project_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `asana_integrations_user_id_unique` ON `asana_integrations` (`user_id`);

CREATE TABLE IF NOT EXISTS `analytics_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text,
	`workspace_id` text NOT NULL,
	`cycle_metrics_json` text NOT NULL,
	`matrix_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `report_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`content` text NOT NULL,
	`context_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `project_risks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`severity` text NOT NULL,
	`metrics_json` text NOT NULL,
	`evaluation_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `project_risks_project_id_unique` ON `project_risks` (`project_id`);

CREATE TABLE IF NOT EXISTS `onboarding_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`transcript` text,
	`tdd_layout_state` text,
	`discovery_state` text,
	`planning_brief` text,
	`status` text DEFAULT 'INTERVIEWING' NOT NULL,
	`doc_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `project_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`github_repo_owner` text,
	`github_repo_name` text,
	`github_repo_id` text,
	`github_project_id` text,
	`github_project_title` text,
	`asana_workspace_gid` text,
	`asana_project_gid` text,
	`asana_project_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS `project_integrations_project_id_unique` ON `project_integrations` (`project_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `project_integrations_github_repo_id_unique` ON `project_integrations` (`github_repo_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `project_integrations_github_project_id_unique` ON `project_integrations` (`github_project_id`);
CREATE UNIQUE INDEX IF NOT EXISTS `project_integrations_asana_project_gid_unique` ON `project_integrations` (`asana_project_gid`);
