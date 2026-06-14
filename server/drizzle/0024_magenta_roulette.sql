ALTER TABLE `users` ADD `has_voice_data` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `voice_onboarding_recording_key` text;--> statement-breakpoint
ALTER TABLE `users` ADD `voice_onboarding_completed_at` integer;