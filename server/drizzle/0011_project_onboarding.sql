ALTER TABLE `projects` ADD `owner_id` text REFERENCES users(id) ON DELETE set null;
ALTER TABLE `projects` ADD `timezone` text;
ALTER TABLE `projects` ADD `github_connected` integer DEFAULT 0 NOT NULL;
ALTER TABLE `projects` ADD `asana_connected` integer DEFAULT 0 NOT NULL;
ALTER TABLE `projects` ADD `is_github_disconnected` integer DEFAULT 0 NOT NULL;
ALTER TABLE `projects` ADD `is_asana_disconnected` integer DEFAULT 0 NOT NULL;
CREATE TABLE `project_collaborators` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
