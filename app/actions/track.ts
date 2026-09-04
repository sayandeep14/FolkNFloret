"use server";

import { headers } from "next/headers";
import { findOrderForTracking } from "@/lib/tracking";

export type TrackState = { error?: string; orderNumber?: string; email?: string };

/** Validates the pair, then hands the page a URL it can render from. */
export async function lookupOrder(
  _previous: TrackState,
  formData: FormData,
): Promise<TrackState> {
  const orderNumber = String(formData.get("order") ?? "");
  const email = String(formData.get("email") ?? "");

  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  const result = await findOrderForTracking(orderNumber, email, ip);

  if (!result.ok) {
    return {
      error:
        result.reason === "rate"
          ? "Too many attempts. Try again in a few minutes."
          : "We could not find an order with that number and email.",
    };
  }

  return { orderNumber: result.order.orderNumber, email: email.trim().toLowerCase() };
}
