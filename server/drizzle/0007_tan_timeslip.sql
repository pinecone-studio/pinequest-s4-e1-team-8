CREATE TABLE `github_integrations` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text NOT NULL,
	`github_login` text,
	`repo_owner` text,
	`repo_name` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `github_integrations_user_id_unique` ON `github_integrations` (`user_id`);--> statement-breakpoint
ALTER TABLE `tasks` ADD `source` text DEFAULT 'internal' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `tool` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `due_date` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `progress` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `blocked` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `done_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `blocked_count` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `time_left` text;--> statement-breakpoint
ALTER TABLE `tasks` ADD `members_json` text DEFAULT '[]' NOT NULL;