ALTER TABLE `tasks` ADD `sequence_order` integer NOT NULL DEFAULT 0;
ALTER TABLE `tasks` ADD `dependencies_json` text NOT NULL DEFAULT '[]';
