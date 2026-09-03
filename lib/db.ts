import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma";

/**
 * One client per process. Next's dev server re-evaluates modules on every
 * change, and a fresh PrismaClient each time exhausts the connection pool
 * within a handful of saves — so in development it is parked on globalThis.
 *
 * Prisma 7 takes its connection through a driver adapter rather than from the
 * schema, which is why the URL is read here and not in schema.prisma.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const db = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
