ALTER TABLE `owner_notifications` ADD `pm_status` enum('draft','pm_review','pm_approved','sent') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `owner_notifications` ADD `pm_note` text;--> statement-breakpoint
ALTER TABLE `owner_notifications` ADD `pm_approved_at` timestamp;