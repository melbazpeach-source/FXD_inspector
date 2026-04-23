import { createConnection } from "mysql2/promise";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const conn = await createConnection(process.env.DATABASE_URL);

try {
  await conn.execute(`ALTER TABLE owner_notifications ADD COLUMN pm_status ENUM('draft','pm_review','pm_approved','sent') NOT NULL DEFAULT 'draft'`);
  console.log("✅ Added pm_status column");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") console.log("ℹ️  pm_status already exists");
  else throw e;
}

try {
  await conn.execute(`ALTER TABLE owner_notifications ADD COLUMN pm_note TEXT`);
  console.log("✅ Added pm_note column");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") console.log("ℹ️  pm_note already exists");
  else throw e;
}

try {
  await conn.execute(`ALTER TABLE owner_notifications ADD COLUMN pm_approved_at TIMESTAMP NULL`);
  console.log("✅ Added pm_approved_at column");
} catch (e) {
  if (e.code === "ER_DUP_FIELDNAME") console.log("ℹ️  pm_approved_at already exists");
  else throw e;
}

await conn.end();
console.log("🎉 Migration complete");
