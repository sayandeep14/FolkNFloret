import { defineConfig } from "prisma/config";

// Prisma 7 no longer reads .env on its own. Node can, and .env.local is where
// Next expects local secrets to live, so the two stay in one place.
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

if (!migrationUrl) {
  throw new Error(
    "Set DATABASE_URL (and DIRECT_URL on a pooled host) in .env.local — see .env.example.",
  );
}

/**
 * Prisma 7 moved the connection URL out of the schema. Migrations read it from
 * here; the application passes a driver adapter to PrismaClient instead, which
 * is why the datasource block carries only a provider.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});
