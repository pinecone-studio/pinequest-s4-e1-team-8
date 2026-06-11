ALTER TABLE `users` ADD `encrypted_google_access_token` text;
ALTER TABLE `users` ADD `encrypted_google_refresh_token` text;
ALTER TABLE `users` ADD `google_token_expiry` integer;
CREATE TABLE `onboarding_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`transcript` text,
	`tdd_layout_state` text,
	`status` text DEFAULT 'INTERVIEWING' NOT NULL,
	`doc_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
