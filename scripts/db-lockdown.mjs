/**
 * Applies prisma/sql/lockdown.sql and reports the result. Safe to re-run, and
 * it should be re-run after any migration that adds a table.
 */
import { readFile } from "node:fs/promises";
import { Client } from "pg";

for (const file of [".env.local", ".env"]) {
  try { process.loadEnvFile(file); break; } catch { /* ambient env */ }
}

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL is not set."); process.exit(1); }

const sql = await readFile("prisma/sql/lockdown.sql", "utf8");
const client = new Client({ connectionString: url });
await client.connect();
await client.query(sql);

const { rows } = await client.query(
  "select tablename, rowsecurity from pg_tables where schemaname = 'public' order by rowsecurity, tablename",
);
await client.end();

const open = rows.filter((r) => !r.rowsecurity);
console.log(`${rows.length - open.length}/${rows.length} tables have row-level security enabled`);
if (open.length) {
  console.error("still open:", open.map((r) => r.tablename).join(", "));
  process.exit(1);
}
console.log("Every public table is closed to the anon and authenticated roles.");
