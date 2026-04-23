ALTER TABLE `owners` ADD `platform_ref` varchar(128);--> statement-breakpoint
ALTER TABLE `owners` ADD `platform_source` enum('palace','console','propertytree','rest','standalone','manual') DEFAULT 'manual';--> statement-breakpoint
ALTER TABLE `owners` ADD `last_pushed_at` timestamp;--> statement-breakpoint
ALTER TABLE `owners` ADD `push_status` enum('synced','pending','error','not_pushed') DEFAULT 'not_pushed';--> statement-breakpoint
ALTER TABLE `owners` ADD `push_error` text;