import mysql2 from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql2.createConnection(process.env.DATABASE_URL!);

const tables = [
  `CREATE TABLE IF NOT EXISTS \`ai_descriptions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`inspection_id\` int NOT NULL,
    \`room_id\` int,
    \`decor\` text,
    \`condition\` text,
    \`points_to_note\` text,
    \`recommendations\` text,
    \`raw_prompt\` text,
    \`generated_at\` timestamp DEFAULT (now()),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`ai_descriptions_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`appointments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`property_id\` int NOT NULL,
    \`scheduled_at\` timestamp NOT NULL,
    \`duration_minutes\` int DEFAULT 60,
    \`inspector_id\` int,
    \`platform_ref\` varchar(128),
    \`platform_source\` enum('palace','console','propertytree','rest','test','manual') DEFAULT 'manual',
    \`sync_status\` enum('synced','pending','error','manual') DEFAULT 'manual',
    \`last_synced_at\` timestamp NULL,
    \`notes\` text,
    \`status\` enum('scheduled','in_progress','completed','cancelled') DEFAULT 'scheduled',
    \`inspection_id\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`appointments_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`inspection_rooms\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`inspection_id\` int NOT NULL,
    \`name\` varchar(128) NOT NULL,
    \`room_order\` int DEFAULT 0,
    \`condition_rating\` enum('excellent','good','fair','poor','na') DEFAULT 'na',
    \`notes\` text,
    \`has_issues\` boolean DEFAULT false,
    \`is_complete\` boolean DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`inspection_rooms_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`inspections\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`property_id\` int NOT NULL,
    \`appointment_id\` int,
    \`inspector_id\` int NOT NULL,
    \`type\` enum('update_based_on_previous','new_full','new_vacate','new_inventory','new_chattels','new_routine','new_move_in') NOT NULL,
    \`status\` enum('draft','in_progress','completed','report_sent') DEFAULT 'draft',
    \`previous_inspection_id\` int,
    \`overall_condition\` enum('excellent','good','fair','poor'),
    \`general_notes\` text,
    \`started_at\` timestamp NULL,
    \`completed_at\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`inspections_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`integration_configs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`user_id\` int NOT NULL,
    \`platform\` enum('palace','console','propertytree','rest','test') NOT NULL,
    \`is_enabled\` boolean DEFAULT false,
    \`is_sandbox\` boolean DEFAULT false,
    \`api_endpoint\` text,
    \`api_key\` text,
    \`api_secret\` text,
    \`webhook_url\` text,
    \`last_synced_at\` timestamp NULL,
    \`sync_status\` enum('idle','syncing','success','error') DEFAULT 'idle',
    \`sync_error\` text,
    \`metadata\` json,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`integration_configs_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`maintenance_items\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`inspection_id\` int NOT NULL,
    \`room_id\` int,
    \`description\` text NOT NULL,
    \`priority\` enum('urgent','high','medium','low') DEFAULT 'medium',
    \`is_damage\` boolean DEFAULT false,
    \`estimated_cost\` varchar(64),
    \`status\` enum('open','in_progress','resolved') DEFAULT 'open',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`maintenance_items_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`photos\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`inspection_id\` int NOT NULL,
    \`room_id\` int,
    \`storage_key\` varchar(512) NOT NULL,
    \`url\` text NOT NULL,
    \`photo_type\` enum('standard','360','damage','maintenance') DEFAULT 'standard',
    \`caption\` text,
    \`taken_at\` timestamp DEFAULT (now()),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`photos_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`properties\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`address\` text NOT NULL,
    \`suburb\` varchar(128),
    \`city\` varchar(128),
    \`postcode\` varchar(16),
    \`landlord_name\` text,
    \`landlord_email\` varchar(320),
    \`landlord_phone\` varchar(32),
    \`platform_ref\` varchar(128),
    \`platform_source\` enum('palace','console','propertytree','rest','test','manual') DEFAULT 'manual',
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`properties_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`remote_submission_photos\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`submission_id\` int NOT NULL,
    \`storage_key\` varchar(512) NOT NULL,
    \`url\` text NOT NULL,
    \`caption\` text,
    \`room_label\` varchar(128),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`remote_submission_photos_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`remote_submissions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`inspection_id\` int,
    \`property_id\` int NOT NULL,
    \`token\` varchar(128) NOT NULL,
    \`submitter_name\` text,
    \`submitter_email\` varchar(320),
    \`notes\` text,
    \`status\` enum('pending','submitted','reviewed','imported') DEFAULT 'pending',
    \`expires_at\` timestamp NULL,
    \`submitted_at\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`remote_submissions_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`remote_submissions_token_unique\` UNIQUE(\`token\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`reports\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`inspection_id\` int NOT NULL,
    \`storage_key\` varchar(512),
    \`url\` text,
    \`status\` enum('generating','ready','sent','error') DEFAULT 'generating',
    \`sent_at\` timestamp NULL,
    \`recipients\` json,
    \`generated_at\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`reports_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`room_items\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`room_id\` int NOT NULL,
    \`label\` varchar(256) NOT NULL,
    \`condition_rating\` enum('excellent','good','fair','poor','na') DEFAULT 'na',
    \`notes\` text,
    \`is_damaged\` boolean DEFAULT false,
    \`maintenance_required\` boolean DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`room_items_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`sync_logs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`integration_id\` int NOT NULL,
    \`platform\` enum('palace','console','propertytree','rest','test') NOT NULL,
    \`action\` varchar(128) NOT NULL,
    \`status\` enum('success','error','warning') DEFAULT 'success',
    \`message\` text,
    \`records_affected\` int DEFAULT 0,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`sync_logs_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`tenants\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`property_id\` int NOT NULL,
    \`name\` text NOT NULL,
    \`email\` varchar(320),
    \`phone\` varchar(32),
    \`is_primary\` boolean DEFAULT false,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`tenants_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of tables) {
  const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `(\w+)`/)?.[1] ?? "?";
  try {
    await conn.execute(sql);
    console.log("✓", tableName);
  } catch (e: any) {
    console.error("✗", tableName, "->", e.message.slice(0, 120));
  }
}

await conn.end();
console.log("\nAll migrations complete.");
