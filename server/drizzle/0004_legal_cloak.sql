CREATE TABLE `sync_mappings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`github_repo_id` text NOT NULL,
	`asana_project_gid` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users` ADD `encrypted_github_token` text;--> statement-breakpoint
ALTER TABLE `users` ADD `encrypted_asana_token` text;