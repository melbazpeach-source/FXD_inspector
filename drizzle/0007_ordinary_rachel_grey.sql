CREATE TABLE `marketing_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`property_id` int NOT NULL,
	`inspection_id` int,
	`url` text NOT NULL,
	`storage_key` varchar(512) NOT NULL,
	`style` varchar(64) NOT NULL DEFAULT 'professional',
	`room_label` varchar(128),
	`prompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `marketing_photos_id` PRIMARY KEY(`id`)
);
