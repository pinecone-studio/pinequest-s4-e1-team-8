-- Drop pre-pivot project-management tables and voice/Azure user columns.
-- Children are dropped before parents to satisfy foreign keys.
PRAGMA foreign_keys=OFF;
--> statement-breakpoint
DROP TABLE IF EXISTS `ai_messages`;
--> statement-breakpoint
DROP TABLE IF EXISTS `ai_conversations`;
--> statement-breakpoint
DROP TABLE IF EXISTS `sub_team_members`;
--> statement-breakpoint
DROP TABLE IF EXISTS `analytics_metrics`;
--> statement-breakpoint
DROP TABLE IF EXISTS `report_snapshots`;
--> statement-breakpoint
DROP TABLE IF EXISTS `project_risks`;
--> statement-breakpoint
DROP TABLE IF EXISTS `project_resources`;
--> statement-breakpoint
DROP TABLE IF EXISTS `project_integrations`;
--> statement-breakpoint
DROP TABLE IF EXISTS `project_collaborators`;
--> statement-breakpoint
DROP TABLE IF EXISTS `onboarding_sessions`;
--> statement-breakpoint
DROP TABLE IF EXISTS `github_integrations`;
--> statement-breakpoint
DROP TABLE IF EXISTS `asana_integrations`;
--> statement-breakpoint
DROP TABLE IF EXISTS `invite_tokens`;
--> statement-breakpoint
DROP TABLE IF EXISTS `milestones`;
--> statement-breakpoint
DROP TABLE IF EXISTS `tasks`;
--> statement-breakpoint
DROP TABLE IF EXISTS `members`;
--> statement-breakpoint
DROP TABLE IF EXISTS `sub_teams`;
--> statement-breakpoint
DROP TABLE IF EXISTS `sync_mappings`;
--> statement-breakpoint
DROP TABLE IF EXISTS `projects`;
--> statement-breakpoint
DROP TABLE IF EXISTS `workspaces`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `encrypted_github_token`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `encrypted_asana_token`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `encrypted_google_access_token`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `encrypted_google_refresh_token`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `google_token_expiry`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `azure_voice_profile_id`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `voice_enrolled_at`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `voice_enrollment_signature`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `has_voice_data`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `voice_onboarding_recording_key`;
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `voice_onboarding_completed_at`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
