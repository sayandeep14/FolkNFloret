import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Razorpay, over plain fetch rather than the SDK. Order creation and signature
 * verification are two HTTP calls and two HMACs; a dependency would mostly add
 * a version to keep current.
 *
 * RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET are server-only and must
 * never acquire a NEXT_PUBLIC_ prefix — that ships them to the browser, which
 * for the key secret means anyone can forge a payment signature. The key *id*
 * is public by design and is handed to the client deliberately, from here.
 */

const API = "https://api.razorpay.com/v1";

export type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
};

/** Null when unconfigured, so the app degrades instead of throwing on import. */
export function razorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return {
    keyId,
    keySecret,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  };
}

export const isTestMode = () =>
  (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_test_");

export type RazorpayOrder = { id: string; amount: number; currency: string };

export async function createRazorpayOrder(
  config: RazorpayConfig,
  input: { amountInPaise: number; receipt: string; notes?: Record<string, string> },
): Promise<RazorpayOrder> {
  const response = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      // Razorpay speaks paise too, so no conversion and no rounding.
      amount: input.amountInPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Razorpay order failed (${response.status}): ${body.slice(0, 200)}`);
  }

  return (await response.json()) as RazorpayOrder;
}

/** Constant-time compare on the hex digests, to leak nothing by timing. */
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * The browser's success callback. Razorpay signs `order_id|payment_id` with the
 * key secret; anything the client reports without a matching signature is a
 * claim, not a payment.
 */
export function verifyCheckoutSignature(
  config: RazorpayConfig,
  input: { razorpayOrderId: string; razorpayPaymentId: string; signature: string },
): boolean {
  const expected = createHmac("sha256", config.keySecret)
    .update(`${input.razorpayOrderId}|${input.razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, input.signature);
}

/**
 * The webhook. Signed over the raw request body, so it must be verified before
 * the body is parsed — parsing first and re-serialising changes the bytes and
 * the signature will never match.
 */
export function verifyWebhookSignature(
  secret: string,
  rawBody: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}
