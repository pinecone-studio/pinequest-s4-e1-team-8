PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_meeting_transcriptions` (
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
--> statement-breakpoint
INSERT INTO `__new_meeting_transcriptions`("id", "meeting_id", "room_name", "audio_url", "egress_id", "transcript", "summary", "error_message", "status", "created_at", "updated_at", "completed_at") SELECT "id", "meeting_id", "room_name", "audio_url", "egress_id", "transcript", "summary", "error_message", "status", "created_at", "updated_at", "completed_at" FROM `meeting_transcriptions`;--> statement-breakpoint
DROP TABLE `meeting_transcriptions`;--> statement-breakpoint
ALTER TABLE `__new_meeting_transcriptions` RENAME TO `meeting_transcriptions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;