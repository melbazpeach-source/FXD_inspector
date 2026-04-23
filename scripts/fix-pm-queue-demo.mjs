import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

// Set notification 1 (inspection complete) to 'draft' so it shows in PM Queue
await db.execute(
  "UPDATE owner_notifications SET pm_status = 'draft', sent_at = NULL, read_at = NULL WHERE id = 1"
);
console.log("Set notification 1 to draft");

// Set notification 2 (maintenance approval) to 'pm_approved' so PM can send it
await db.execute(
  "UPDATE owner_notifications SET pm_status = 'pm_approved', sent_at = NULL, read_at = NULL, pm_approved_at = NOW() WHERE id = 2"
);
console.log("Set notification 2 to pm_approved");

// Add a new draft for Meridian Property Holdings (owner 2)
const [props] = await db.execute("SELECT id FROM properties WHERE owner_id = 2 LIMIT 1");
const propId = props[0]?.id;
if (propId) {
  await db.execute(
    `INSERT INTO owner_notifications (owner_id, property_id, type, title, summary, estimated_cost, pm_status, approval_status, createdAt, updatedAt)
     VALUES (2, ?, 'maintenance_approval', 'Maintenance Approval Required — Hot Water Cylinder',
     'The hot water cylinder is 14 years old and showing signs of corrosion. Recommend proactive replacement before failure. Plumber available next week.',
     '$1,200–$1,800 (supply & install)', 'draft', 'pending', NOW(), NOW())`,
    [propId]
  );
  console.log("Added draft notification for Meridian (owner 2)");
}

// Verify
const [rows] = await db.execute("SELECT id, owner_id, title, pm_status FROM owner_notifications ORDER BY id");
console.log("All notifications:", rows.map(r => `[${r.id}] owner:${r.owner_id} pm_status:${r.pm_status} — ${r.title?.substring(0, 50)}`));

await db.end();
console.log("Done!");
