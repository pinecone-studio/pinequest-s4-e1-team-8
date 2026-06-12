CREATE TABLE `meeting_summaries` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`content` text NOT NULL,
	`key_points` text,
	`action_items` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meeting_summaries_meeting_id_unique` ON `meeting_summaries` (`meeting_id`);--> statement-breakpoint
CREATE TABLE `meeting_transcript_segments` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`speaker_name` text NOT NULL,
	`text` text NOT NULL,
	`timestamp` integer NOT NULL,
	FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
