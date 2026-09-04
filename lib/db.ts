import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma";

/**
 * One client per process. Next's dev server re-evaluates modules on every
 * change, and a fresh PrismaClient each time exhausts the connection pool
 * within a handful of saves — so in development it is parked on globalThis.
 *
 * Prisma 7 takes its connection through a driver adapter rather than from the
 * schema, which is why the URL is read here and not in schema.prisma.
 *
 * The client is built on first *use*, not on import. A build host may have no
 * DATABASE_URL — the very first deploy, before the variables are set — and
 * importing this module must not be what fails there. Catalogue reads already
 * degrade gracefully (see `safeSlugs`), so a build without a database produces
 * a working site whose pages render on demand instead of a build that dies
 * while collecting page data.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Locally: copy .env.example to .env.local. " +
        "On a host: set it in the project's environment variables.",
    );
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

function resolve(): PrismaClient {
  return globalForPrisma.prisma ?? create();
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = resolve();
    const value = Reflect.get(client, property) as unknown;
    // Bind so `$transaction`, `$connect` and friends keep their receiver.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
