ALTER TABLE `users` ADD `encrypted_google_access_token` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `encrypted_google_refresh_token` text;
--> statement-breakpoint
ALTER TABLE `users` ADD `google_token_expiry` integer;
