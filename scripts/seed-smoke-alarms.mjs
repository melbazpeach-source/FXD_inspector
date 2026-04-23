import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await createConnection(url);

// Get property IDs
const [props] = await conn.execute("SELECT id, address FROM properties ORDER BY id");
console.log("Properties:", props.map(p => `${p.id}: ${p.address}`).join(", "));

if (props.length === 0) {
  console.log("No properties found — run seed-demo.mjs first");
  process.exit(1);
}

// Clear existing smoke alarms
await conn.execute("DELETE FROM smoke_alarms");
console.log("Cleared existing smoke alarms");

const alarms = [];

// Property 1: 14 Rata Street, Newtown (single storey, fully compliant)
if (props[0]) {
  const pid = props[0].id;
  alarms.push(
    [pid, null, "Hallway outside master bedroom", "single_storey", "1.8m", "photoelectric", "long_life_battery", true, true, false, "2031-04", "2023-04", "2026-04", true, null, null, null, false, "Tested and working. Photoelectric long-life. Installed April 2023."],
    [pid, null, "Hallway outside bedroom 2", "single_storey", "2.2m", "photoelectric", "long_life_battery", true, true, false, "2031-04", "2023-04", "2026-04", true, null, null, null, false, "Tested and working. Same installation batch as master bedroom alarm."],
    [pid, null, "Kitchen / living area", "single_storey", "4.5m", "photoelectric", "long_life_battery", true, false, false, "2031-04", "2023-04", null, true, null, null, null, false, "Photoelectric long-life. Not tested during this inspection — recommend testing at next visit."]
  );
}

// Property 2: Unit 4/22 Beach Road, Mount Maunganui (single storey, one non-compliant alarm)
if (props[1]) {
  const pid = props[1].id;
  alarms.push(
    [pid, null, "Hallway outside master bedroom", "single_storey", "2.0m", "photoelectric", "long_life_battery", true, true, false, "2032-01", "2024-01", "2026-04", true, null, null, null, false, "Compliant. Photoelectric long-life installed January 2024."],
    [pid, null, "Open plan living/kitchen", "single_storey", "3.8m", "ionisation", "replaceable_battery", true, false, false, null, null, null, false, "NON-COMPLIANT: Ionisation type with replaceable battery. Installed post-July 2016. Must be replaced with photoelectric long-life alarm at next tenancy commencement.", null, null, false, "Older alarm — needs replacement before next tenancy. Ionisation type, replaceable battery. Does not meet current standards."]
  );
}

// Property 3: 7 Kauri Drive, Papamoa (two-storey, interconnected, fully compliant)
if (props[2]) {
  const pid = props[2].id;
  alarms.push(
    [pid, null, "Upstairs hallway outside master bedroom", "first", "1.5m", "photoelectric", "long_life_battery", true, true, true, "2033-06", "2025-06", "2026-04", true, null, null, null, false, "Interconnected. Tested and working. Excellent compliance."],
    [pid, null, "Upstairs hallway outside bedroom 2", "first", "2.1m", "photoelectric", "long_life_battery", true, true, true, "2033-06", "2025-06", "2026-04", true, null, null, null, false, "Interconnected. Tested and working."],
    [pid, null, "Downstairs hallway / living area", "ground", "3.2m", "photoelectric", "long_life_battery", true, true, true, "2033-06", "2025-06", "2026-04", true, null, null, null, false, "Interconnected. Ground floor coverage confirmed. All three alarms sound simultaneously when tested."]
  );
}

// Property 4: 45 Tui Street, Palmerston North (single storey, one alarm not working)
if (props[3]) {
  const pid = props[3].id;
  alarms.push(
    [pid, null, "Hallway outside bedroom 1", "single_storey", "2.4m", "photoelectric", "long_life_battery", true, true, false, "2030-11", "2022-11", "2026-04", true, null, null, null, false, "Compliant. Tested and working."],
    [pid, null, "Hallway outside bedroom 2", "single_storey", "1.9m", "photoelectric", "long_life_battery", false, false, false, "2030-11", "2022-11", null, false, "CRITICAL: Alarm not working. Tenant reported it was beeping intermittently last week. Battery may be depleted despite being a long-life unit. Replace immediately — landlord must rectify before next tenancy or faces penalty up to $7,200.", null, null, false, "Not working — needs immediate replacement. Tenant reported intermittent beeping."]
  );
}

// Insert all alarms
for (const alarm of alarms) {
  await conn.execute(
    `INSERT INTO smoke_alarms 
      (property_id, inspection_id, location, level, distance_from_bedroom, alarm_type, power_source, 
       is_working, is_tested, is_interconnected, expiry_date, install_date, last_tested_date, 
       meets_standards, compliance_notes, photo_url, photo_key, is_pre_regulation, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    alarm
  );
}

console.log(`✅ Inserted ${alarms.length} smoke alarm records across ${props.length} properties`);
await conn.end();
