ALTER TABLE `tasks` ADD `source` text DEFAULT 'internal' NOT NULL;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `tool` text;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `due_date` text;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `progress` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `blocked` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `done_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `blocked_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `time_left` text;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `members_json` text DEFAULT '[]' NOT NULL;
