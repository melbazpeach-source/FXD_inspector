CREATE TABLE `agent_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agent_id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`skills` json DEFAULT ('[]'),
	`connectors` json DEFAULT ('[]'),
	`system_prompt` text,
	`preferred_llm_provider` varchar(64) DEFAULT 'builtin',
	`is_enabled` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agent_configs_id` PRIMARY KEY(`id`),
	CONSTRAINT `agent_configs_agent_id_unique` UNIQUE(`agent_id`)
);
--> statement-breakpoint
CREATE TABLE `connectors` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`type` varchar(64) NOT NULL,
	`config` json,
	`is_active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `connectors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provider_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('llm','voice','ocr','floor_plans') NOT NULL,
	`provider` varchar(64) NOT NULL,
	`is_active` boolean DEFAULT false,
	`api_key` text,
	`config` json,
	`tested_at` timestamp,
	`test_status` enum('ok','error','untested') DEFAULT 'untested',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `provider_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` varchar(64) NOT NULL,
	`name` varchar(128) NOT NULL,
	`description` text,
	`category` varchar(64),
	`is_built_in` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
