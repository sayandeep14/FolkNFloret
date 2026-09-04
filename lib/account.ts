import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/** The signed-in user, or null. Pages decide what to do about it. */
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return db.user.findUnique({ where: { id: session.user.id } });
}

export async function requireUser() {
  const user = await currentUser();
  // Middleware already redirected anyone without a session cookie; this is the
  // real check, and it also covers a cookie whose session has been revoked.
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function listOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: true, shipments: true },
  });
}

export async function getOrder(userId: string, orderNumber: string) {
  return db.order.findFirst({
    where: { orderNumber, userId },
    include: { items: true, shipments: true, payments: true },
  });
}

export async function listAddresses(userId: string) {
  return db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}
