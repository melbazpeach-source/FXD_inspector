import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);
const [cols] = await db.execute("DESCRIBE owner_notifications");
console.log("columns:", cols.map(c => c.Field));
const [rows] = await db.execute("SELECT * FROM owner_notifications LIMIT 5");
console.log("owner_notifications rows:", JSON.stringify(rows, null, 2));
const [owners] = await db.execute("SELECT id, name FROM owners LIMIT 10");
console.log("owners:", JSON.stringify(owners, null, 2));
await db.end();
