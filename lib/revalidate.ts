"use server";

import { updateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog-types";

/**
 * Drops every cached catalogue read. Call after any write that changes what
 * the shop shows — a price, a stock adjustment, publishing or archiving a
 * product. Phase 9's admin actions all end here.
 *
 * `updateTag` rather than `revalidateTag`: it gives read-your-own-writes
 * semantics inside a Server Action, so an admin who saves a price sees the new
 * price on the very next render instead of the stale one. (It is Server
 * Actions only — a webhook or route handler needs
 * `revalidateTag(CATALOG_TAG, "max")` instead, which Next 16 requires a cache
 * profile for.)
 *
 * One tag rather than per-product tags on purpose: a price change moves the
 * listing pages, the collection pages and any bundle containing the item, so
 * the blast radius is the whole catalogue anyway. Splitting it would only
 * create ways to forget one.
 */
export async function revalidateCatalog() {
  updateTag(CATALOG_TAG);
}
