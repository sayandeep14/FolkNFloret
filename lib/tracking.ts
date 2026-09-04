import "server-only";
import { db } from "@/lib/db";
import { withinLimit } from "@/lib/rate-limit";

/**
 * Looking up an order without an account.
 *
 * The order number alone is not enough — it appears in emails, on receipts and
 * in the parcel, so anyone holding one would otherwise read a stranger's
 * address and phone number. The email must match too, and both together are
 * rate limited so the pair cannot be brute-forced.
 */
export async function findOrderForTracking(
  orderNumber: string,
  email: string,
  ip: string,
) {
  const cleanNumber = orderNumber.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanNumber || !cleanEmail) return { ok: false as const, reason: "missing" };

  if (!(await withinLimit(`track:${ip}`, 20, 10 * 60))) {
    return { ok: false as const, reason: "rate" };
  }

  const order = await db.order.findFirst({
    where: { orderNumber: cleanNumber, email: cleanEmail },
    include: { items: true, shipments: { orderBy: { createdAt: "desc" } } },
  });

  // Deliberately the same answer for "no such order" and "wrong email": the
  // difference would confirm which order numbers exist.
  if (!order) return { ok: false as const, reason: "notfound" };
  return { ok: true as const, order };
}
