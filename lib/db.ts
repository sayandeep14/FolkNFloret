import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma";

/**
 * One client per process, built on first *use* rather than on import.
 *
 * Lazy because a build host may have no DATABASE_URL — the first deploy,
 * before the variables are set — and importing this module must not be what
 * fails there. Catalogue reads degrade gracefully, so a build without a
 * database produces a working site whose pages render on demand.
 *
 * Memoised in a module-level variable, which is the part that matters: the
 * proxy below resolves the client on *every* property access, so anything that
 * rebuilds it per access builds a fresh connection pool per query. That is not
 * hypothetical — an earlier version only memoised outside production, and in
 * production a single add-to-bag opened six pools and six TLS handshakes to a
 * database on another continent. It took twelve seconds.
 *
 * globalThis is used as well, but only in development, where Next re-evaluates
 * modules on every change and a fresh client each time exhausts the pool
 * within a handful of saves.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let client: PrismaClient | undefined = globalForPrisma.prisma;

function resolve(): PrismaClient {
  if (client) return client;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Locally: copy .env.example to .env.local. " +
        "On a host: set it in the project's environment variables.",
    );
  }

  client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const resolved = resolve();
    const value = Reflect.get(resolved, property) as unknown;
    // Bind so `$transaction`, `$connect` and friends keep their receiver.
    return typeof value === "function" ? value.bind(resolved) : value;
  },
});
