ALTER TABLE `projects` ADD `invite_token` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `projects_invite_token_unique` ON `projects` (`invite_token`);
