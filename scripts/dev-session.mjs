/**
 * Development only. Creates a test user, an address and a session row so the
 * account and checkout pages can be exercised before a mail provider exists.
 * Prints the session token; put it in an `authjs.session-token` cookie.
 *
 *   node scripts/dev-session.mjs        # create, prints the token
 *   node scripts/dev-session.mjs clean  # remove the user and everything of theirs
 *
 * Never run this against production: it writes a session nobody authenticated
 * for. It refuses if NODE_ENV says production.
 */
if (process.env.NODE_ENV === "production") {
  throw new Error("dev-session is not for production.");
}
import { Client } from "pg";
import { randomBytes } from "node:crypto";
process.loadEnvFile(".env.local");
const c = new Client({ connectionString: process.env.DIRECT_URL });
await c.connect();
const EMAIL = "test-account@folknfloret.local";

if (process.argv[2] === "clean") {
  await c.query(`delete from "User" where email = $1`, [EMAIL]);
  console.log("cleaned");
} else {
  await c.query(`delete from "User" where email = $1`, [EMAIL]);
  const { rows: [u] } = await c.query(
    `insert into "User" (id, email, name, phone, "updatedAt") values ($1,$2,$3,$4, now()) returning id`,
    [randomBytes(12).toString("hex"), EMAIL, "Ananya R.", "9876543210"]);
  await c.query(
    `insert into "Address" (id, "userId", name, line1, line2, city, state, pincode, phone, "isDefault", "updatedAt")
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true, now())`,
    [randomBytes(12).toString("hex"), u.id, "Ananya R.", "12 Coonoor Road", "Kotagiri", "Kotagiri", "Tamil Nadu", "643217", "9876543210"]);
  const token = randomBytes(32).toString("hex");
  await c.query(
    `insert into "Session" (id, "sessionToken", "userId", expires) values ($1,$2,$3, now() + interval '7 days')`,
    [randomBytes(12).toString("hex"), token, u.id]);
  console.log(token);
}
await c.end();
