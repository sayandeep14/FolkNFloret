"use server";

import { z } from "zod";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { CART_COOKIE, readCart } from "@/lib/cart";
import { addressSchema } from "@/lib/address";
import { placeOrder, releaseExpiredReservations } from "@/lib/checkout";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** Set once the order exists. The form navigates on seeing it. */
  orderNumber?: string;
};

/** Pulls `shipping.city` etc. out of a flat FormData into a nested object. */
function section(formData: FormData, prefix: string) {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith(`${prefix}.`)) out[key.slice(prefix.length + 1)] = String(value);
  }
  return out;
}

const contactSchema = z.object({
  email: z.email("Please give an email we can send the receipt to."),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|0)/, ""))
    .pipe(z.string().regex(/^[6-9][0-9]{9}$/, "Ten digits starting 6–9.")),
});

const giftSchema = z.object({
  isGift: z.boolean(),
  recipient: z.string().trim().max(80).optional(),
  message: z.string().trim().max(300).optional(),
  hidePrices: z.boolean(),
  requestedFor: z.string().optional(),
});

export async function submitCheckout(
  _previous: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  // Reconcile abandoned holds first, so someone is not told a piece is gone
  // when it is only sitting in a checkout nobody finished.
  await releaseExpiredReservations();

  const fieldErrors: Record<string, string> = {};
  const collect = (result: z.ZodSafeParseResult<unknown>, prefix = "") => {
    if (result.success) return;
    for (const issue of result.error.issues) {
      const key = `${prefix}${String(issue.path[0] ?? "form")}`;
      fieldErrors[key] ??= issue.message;
    }
  };

  const contact = contactSchema.safeParse({
    email: formData.get("email"),
    phone: formData.get("phone"),
  });
  collect(contact);

  const shipping = addressSchema.safeParse(section(formData, "shipping"));
  collect(shipping, "shipping.");

  const sameBilling = formData.get("sameBilling") !== "off";
  const billing = sameBilling
    ? shipping
    : addressSchema.safeParse(section(formData, "billing"));
  if (!sameBilling) collect(billing, "billing.");

  const isGift = formData.get("isGift") === "on";
  const gift = giftSchema.safeParse({
    isGift,
    recipient: formData.get("giftRecipient") || undefined,
    message: formData.get("giftMessage") || undefined,
    hidePrices: formData.get("giftHidePrices") === "on",
    requestedFor: formData.get("requestedFor") || undefined,
  });
  collect(gift, "gift.");

  if (Object.keys(fieldErrors).length) return { fieldErrors };
  if (!contact.success || !shipping.success || !billing.success || !gift.success) {
    return { error: "Please check the form." };
  }

  const cart = await readCart();
  if (!cart.lines.length) return { error: "Your bag is empty." };

  const token = (await cookies()).get(CART_COOKIE)?.value;
  const cartRow = token ? await db.cart.findUnique({ where: { token } }) : null;
  if (!cartRow) return { error: "Your bag could not be found. Try reloading." };

  const session = await auth();

  const result = await placeOrder(cart, cartRow.id, {
    email: contact.data.email.toLowerCase(),
    phone: contact.data.phone,
    shipping: shipping.data,
    billing: billing.data,
    gift: {
      isGift: gift.data.isGift,
      recipient: gift.data.recipient,
      message: gift.data.message,
      hidePrices: gift.data.hidePrices,
      requestedFor: gift.data.requestedFor
        ? new Date(gift.data.requestedFor)
        : undefined,
    },
    userId: session?.user?.id,
  });

  if (!result.ok) return { error: result.error };

  // Returns the number rather than calling redirect(). redirect() throws a
  // control-flow signal that has to survive being returned through
  // useActionState, and here it did not — the order was created and the
  // browser stayed put, which is the worst of both. An explicit hand-off is
  // one line of client code and is observable when it breaks.
  return { orderNumber: result.orderNumber };
}
