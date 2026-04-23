import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });

const conn = await createConnection(process.env.DATABASE_URL);
const sql = readFileSync(resolve(__dirname, "../drizzle/0005_nappy_lady_vermin.sql"), "utf8");
const statements = sql.split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean);

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("✅ OK:", stmt.slice(0, 70));
  } catch (e) {
    if (e.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("⚠️  Already exists:", stmt.slice(0, 70));
    } else {
      throw e;
    }
  }
}
await conn.end();
console.log("Migration complete!");
