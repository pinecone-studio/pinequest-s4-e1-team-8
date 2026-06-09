ALTER TABLE `tasks` ADD `sequence_order` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `tasks` ADD `dependency_task_ids_json` text DEFAULT '[]' NOT NULL;
