CREATE TABLE `project_collaborators` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `asana_integrations` (
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
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asana_integrations_user_id_unique` ON `asana_integrations` (`user_id`);--> statement-breakpoint
CREATE TABLE `analytics_metrics` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text,
	`workspace_id` text NOT NULL,
	`cycle_metrics_json` text NOT NULL,
	`matrix_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `report_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`content` text NOT NULL,
	`context_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_risks` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`severity` text NOT NULL,
	`metrics_json` text NOT NULL,
	`evaluation_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_risks_project_id_unique` ON `project_risks` (`project_id`);--> statement-breakpoint
CREATE TABLE `onboarding_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`transcript` text,
	`tdd_layout_state` text,
	`discovery_state` text,
	`planning_brief` text,
	`status` text DEFAULT 'INTERVIEWING' NOT NULL,
	`doc_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users` ADD `encrypted_google_access_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `encrypted_google_refresh_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `google_token_expiry` integer;--> statement-breakpoint
ALTER TABLE `projects` ADD `owner_id` text REFERENCES users(id);--> statement-breakpoint
ALTER TABLE `projects` ADD `timezone` text;--> statement-breakpoint
ALTER TABLE `projects` ADD `github_connected` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `asana_connected` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_github_disconnected` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `is_asana_disconnected` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `projects` ADD `invite_token` text;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_invite_token_unique` ON `projects` (`invite_token`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `sequence_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `dependencies_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `dependency_task_ids_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `sync_state` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `board_column` text;--> statement-breakpoint
ALTER TABLE `github_integrations` ADD `github_project_id` text;