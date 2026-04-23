import { drizzle } from "drizzle-orm/mysql2";
import mysql2 from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql2.createConnection(process.env.DATABASE_URL!);
const db = drizzle(conn);

const sqls = [
  `ALTER TABLE \`integration_configs\` MODIFY COLUMN \`metadata\` json`,
  `ALTER TABLE \`reports\` MODIFY COLUMN \`recipients\` json`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log("✓", sql.slice(0, 60));
  } catch (e: any) {
    console.warn("⚠", e.message.slice(0, 80));
  }
}

await conn.end();
console.log("Migration complete.");
