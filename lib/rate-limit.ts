import "server-only";
import { db } from "@/lib/db";

/**
 * A fixed-window counter kept in Postgres.
 *
 * In memory would be simpler and useless: every serverless invocation is a
 * fresh process, so an in-process counter resets constantly and limits
 * nothing. Upstash Redis is the eventual answer at volume; a table is exact,
 * costs one round trip, and needs no third service to launch with.
 *
 * Returns true when the caller is within budget.
 */
export async function withinLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const existing = await db.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.windowStart < windowStart) {
    await db.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: now },
      update: { count: 1, windowStart: now },
    });
    return true;
  }

  if (existing.count >= max) return false;

  await db.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return true;
}
