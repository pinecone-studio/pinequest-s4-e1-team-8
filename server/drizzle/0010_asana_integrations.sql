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
CREATE UNIQUE INDEX `asana_integrations_user_id_unique` ON `asana_integrations` (`user_id`);
