CREATE TABLE `meeting_transcriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`meeting_id` text NOT NULL,
	`room_name` text NOT NULL,
	`audio_url` text,
	`egress_id` text,
	`transcript` text,
	`summary` text,
	`error_message` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	`completed_at` integer
);
