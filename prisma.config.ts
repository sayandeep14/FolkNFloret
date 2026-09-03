import { defineConfig, env } from "prisma/config";

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
 * Prisma 7 moved the connection URL out of the schema. Migrations read it from
 * here; the application passes a driver adapter to PrismaClient instead (see
 * lib/db.ts), which is why the datasource block carries only a provider.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node --experimental-strip-types prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
