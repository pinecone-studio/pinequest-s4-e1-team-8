ALTER TABLE `onboarding_sessions` ADD `project_id` text REFERENCES `projects`(`id`) ON DELETE set null;--> statement-breakpoint
ALTER TABLE `projects` ADD `ai_goals` text;--> statement-breakpoint
CREATE TABLE `project_resources` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_resources_project_id_idx` ON `project_resources` (`project_id`);
