import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await createConnection(url);

await conn.execute(`CREATE TABLE IF NOT EXISTS \`smoke_alarms\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`property_id\` int NOT NULL,
  \`inspection_id\` int,
  \`location\` varchar(256) NOT NULL,
  \`level\` enum('ground','first','second','third','basement','single_storey') DEFAULT 'ground',
  \`distance_from_bedroom\` varchar(32),
  \`alarm_type\` enum('photoelectric','ionisation','heat','combined','unknown') DEFAULT 'unknown',
  \`power_source\` enum('long_life_battery','replaceable_battery','hard_wired','unknown') DEFAULT 'unknown',
  \`is_working\` boolean DEFAULT true,
  \`is_tested\` boolean DEFAULT false,
  \`is_interconnected\` boolean DEFAULT false,
  \`expiry_date\` varchar(32),
  \`install_date\` varchar(32),
  \`last_tested_date\` varchar(32),
  \`meets_standards\` boolean DEFAULT true,
  \`compliance_notes\` text,
  \`photo_url\` text,
  \`photo_key\` text,
  \`is_pre_regulation\` boolean DEFAULT false,
  \`notes\` text,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`smoke_alarms_id\` PRIMARY KEY(\`id\`)
)`);

console.log("✅ smoke_alarms table created successfully");
await conn.end();
