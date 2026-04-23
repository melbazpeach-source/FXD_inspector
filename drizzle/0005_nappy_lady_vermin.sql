CREATE TABLE `owner_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`property_id` int NOT NULL,
	`inspection_id` int,
	`type` enum('inspection_complete','maintenance_approval','rent_appraisal','hh_compliance','maintenance_plan','renovate_recommendations') NOT NULL,
	`title` varchar(256) NOT NULL,
	`summary` text,
	`estimated_cost` varchar(64),
	`approval_status` enum('pending','approved','deferred','discuss') DEFAULT 'pending',
	`approval_note` text,
	`approved_at` timestamp,
	`sent_at` timestamp,
	`read_at` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `owner_notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `owner_properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`owner_id` int NOT NULL,
	`property_id` int NOT NULL,
	`is_primary` boolean DEFAULT true,
	`ownership_share` int DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owner_properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `owners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(256) NOT NULL,
	`entity_type` enum('individual','company','trust','partnership') DEFAULT 'individual',
	`company_name` varchar(256),
	`email` varchar(320),
	`phone` varchar(32),
	`alternate_phone` varchar(32),
	`mailing_address` text,
	`preferred_contact` enum('email','phone','sms','portal') DEFAULT 'email',
	`report_frequency` enum('after_each_inspection','monthly','quarterly') DEFAULT 'after_each_inspection',
	`portal_enabled` boolean DEFAULT false,
	`portal_token` varchar(128),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `owners_id` PRIMARY KEY(`id`)
);
