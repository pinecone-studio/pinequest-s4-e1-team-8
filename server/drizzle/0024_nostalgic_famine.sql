CREATE TABLE `standalone_recordings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`audio_url` text NOT NULL,
	`status` text DEFAULT 'processing' NOT NULL,
	`speaker_count` integer,
	`transcript` text,
	`key_points` text,
	`script_segments` text,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
