import "dotenv/config";
import mysql from "mysql2/promise";

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const sqls = [
  `ALTER TABLE \`owners\` ADD COLUMN IF NOT EXISTS \`platform_ref\` varchar(128)`,
  `ALTER TABLE \`owners\` ADD COLUMN IF NOT EXISTS \`platform_source\` enum('palace','console','propertytree','rest','standalone','manual') DEFAULT 'manual'`,
  `ALTER TABLE \`owners\` ADD COLUMN IF NOT EXISTS \`last_pushed_at\` timestamp NULL`,
  `ALTER TABLE \`owners\` ADD COLUMN IF NOT EXISTS \`push_status\` enum('synced','pending','error','not_pushed') DEFAULT 'not_pushed'`,
  `ALTER TABLE \`owners\` ADD COLUMN IF NOT EXISTS \`push_error\` text`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log(`✅ ${sql.slice(0, 60)}…`);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log(`⏭️  Column already exists, skipping`);
    } else {
      throw e;
    }
  }
}

await conn.end();
console.log("🎉 Owners CRM migration complete");
