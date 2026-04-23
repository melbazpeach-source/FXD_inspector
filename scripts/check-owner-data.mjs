import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

// Check columns
const [cols] = await db.execute("DESCRIBE owner_notifications");
console.log("owner_notifications columns:", cols.map(c => c.Field));

// Check data
const [rows] = await db.execute("SELECT * FROM owner_notifications LIMIT 5");
console.log("owner_notifications data:", JSON.stringify(rows, null, 2));

// Check owners
const [owners] = await db.execute("SELECT id, name FROM owners LIMIT 5");
console.log("owners:", JSON.stringify(owners, null, 2));

await db.end();
