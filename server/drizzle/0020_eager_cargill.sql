CREATE TABLE `invite_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`project_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invite_tokens_token_unique` ON `invite_tokens` (`token`);--> statement-breakpoint
CREATE TABLE `milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` text,
	`sequence_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `project_integrations` (
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
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `project_integrations_project_id_unique` ON `project_integrations` (`project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_integrations_github_repo_id_unique` ON `project_integrations` (`github_repo_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_integrations_github_project_id_unique` ON `project_integrations` (`github_project_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_integrations_asana_project_gid_unique` ON `project_integrations` (`asana_project_gid`);