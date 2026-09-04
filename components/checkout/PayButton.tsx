"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  confirmPayment,
  reportPaymentFailure,
  startPayment,
} from "@/app/actions/payment";
import { Button } from "@/components/ui";

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type RazorpayInstance = { open: () => void; on: (event: string, cb: (e: unknown) => void) => void };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

/** Loaded on demand rather than on every page — it is 100KB nobody browsing needs. */
function loadCheckoutScript(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function PayButton({
  orderNumber,
  disabledReason,
}: {
  orderNumber: string;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (disabledReason) {
    return (
      <>
        <Button full disabled>
          Pay now
        </Button>
        <p className="cart-page__note">{disabledReason}</p>
      </>
    );
  }

  const pay = async () => {
    setBusy(true);
    setError(null);

    const started = await startPayment(orderNumber);
    if (!started.ok) {
      setError(started.error);
      setBusy(false);
      return;
    }

    if (!(await loadCheckoutScript()) || !window.Razorpay) {
      setError("The payment window could not load. Check your connection and try again.");
      setBusy(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: started.keyId,
      order_id: started.razorpayOrderId,
      amount: started.amountInPaise,
      currency: "INR",
      name: "Folks & Florets",
      description: `Order ${started.orderNumber}`,
      prefill: started.prefill,
      theme: { color: "#221822" },
      handler: async (response: RazorpayHandlerResponse) => {
        // Reported, then verified server-side. The webhook confirms it
        // independently, so a customer who closes the tab here is still fine.
        const confirmed = await confirmPayment({
          orderNumber,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        });

        if (confirmed.ok) {
          router.push(`/checkout/success/${orderNumber}`);
          return;
        }
        // Razorpay says paid, we could not verify. Send them to the order page
        // rather than claiming failure — the webhook will settle it.
        setError(
          "Your payment went through but we could not confirm it here. We are checking; your order page will update.",
        );
        setBusy(false);
      },
      modal: {
        ondismiss: () => {
          void reportPaymentFailure(orderNumber, "dismissed");
          setBusy(false);
        },
      },
    });

    razorpay.on("payment.failed", (event: unknown) => {
      const detail = event as { error?: { description?: string } };
      void reportPaymentFailure(orderNumber, detail?.error?.description);
      setError(detail?.error?.description ?? "That payment did not go through.");
      setBusy(false);
    });

    razorpay.open();
  };

  return (
    <>
      <Button full onClick={pay} disabled={busy}>
        {busy ? "Opening payment…" : "Pay now"}
      </Button>
      {error ? (
        <p className="drawer__notice drawer__notice--error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
