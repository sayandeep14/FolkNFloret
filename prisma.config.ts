import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env on its own. Node can, and .env.local is where
// Next expects local secrets to live, so the two stay in one place. On a build
// host there is no file and the ambient environment supplies them instead.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
    break;
  } catch {
    // Not present — fall through to the next candidate, then to the ambient
    // environment, which is how CI and production supply it.
  }
}

/**
 * DDL must not go through a transaction pooler: it hands you a different
 * backend per statement, and an advisory lock taken on one connection is not
 * held on the next, which is exactly what Prisma's migration lock relies on.
 * So migrations use DIRECT_URL when it is set, and the app keeps DATABASE_URL
 * (see lib/db.ts) for the pooled connection it wants under load.
 */
const migrationUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

/**
 * Deliberately does not throw when there is no URL. `prisma generate` needs
 * only the schema — it produces types, not connections — and it runs on every
 * build, including the first one on a host where the variables have not been
 * set yet. Failing there reports a missing database as a config-file parse
 * error, which is a long way from the truth. The migrate commands ask for the
 * URL themselves, and say so plainly when it is absent.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
  ...(migrationUrl ? { datasource: { url: migrationUrl } } : {}),
});
