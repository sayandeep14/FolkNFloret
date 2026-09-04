import "server-only";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Studio-only surfaces. Phase 9 builds the admin proper; this is the minimum
 * needed to actually fulfil an order, and the check it will keep using.
 *
 * Roles are set in the database by hand for now — there is deliberately no way
 * to grant yourself one through the app.
 */
export async function currentStaff() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user || (user.role !== "STAFF" && user.role !== "ADMIN")) return null;
  return user;
}

export async function requireStaff() {
  const user = await currentStaff();
  if (!user) throw new Error("FORBIDDEN");
  return user;
}
