"use client";

import { useActionState } from "react";
import {
  markDelivered,
  markShipped,
  refundOrder,
  type FulfilState,
} from "@/app/actions/fulfilment";
import { Button, Field, Input } from "@/components/ui";

type Shipment = {
  courier: string | null;
  awb: string | null;
  trackingUrl: string | null;
  status: string;
};

export function FulfilPanel({
  orderNumber,
  status,
  shipment,
}: {
  orderNumber: string;
  status: string;
  shipment: Shipment | null;
}) {
  const [shipState, ship, shipping] = useActionState<FulfilState, FormData>(markShipped, {});
  const [refundState, refund, refunding] = useActionState<FulfilState, FormData>(refundOrder, {});

  const canShip = status === "PAID" || status === "PROCESSING";
  const canDeliver = status === "SHIPPED";
  const canRefund = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status);

  return (
    <div className="fulfil">
      {canShip ? (
        <form action={ship} className="fulfil__form">
          <h3>Mark shipped</h3>
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <input type="hidden" name="provider" value="manual" />

          <Field label="Courier">
            {(p) => <Input {...p} name="courier" placeholder="Delhivery" />}
          </Field>
          <Field label="AWB" hint="The tracking number on the label.">
            {(p) => <Input {...p} name="awb" />}
          </Field>
          <Field label="Tracking URL" hint="Optional; goes in the customer's email.">
            {(p) => <Input {...p} name="trackingUrl" type="url" placeholder="https://" />}
          </Field>

          <Button type="submit" size="sm" disabled={shipping}>
            {shipping ? "Sending…" : "Mark shipped and notify"}
          </Button>
          {shipState.error ? (
            <p className="drawer__notice drawer__notice--error" role="alert">
              {shipState.error}
            </p>
          ) : null}
        </form>
      ) : null}

      {shipment ? (
        <>
          <h3>Shipment</h3>
          <p>
            {shipment.courier ?? "—"}
            {shipment.awb ? <> · {shipment.awb}</> : null}
            <br />
            {shipment.status.toLowerCase().replace(/_/g, " ")}
          </p>
        </>
      ) : null}

      {canDeliver ? (
        <form action={markDelivered} className="fulfil__form">
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <Button type="submit" size="sm" variant="ghost">
            Mark delivered and notify
          </Button>
        </form>
      ) : null}

      {canRefund ? (
        <form action={refund} className="fulfil__form">
          <h3>Refund</h3>
          <input type="hidden" name="orderNumber" value={orderNumber} />
          <p className="cart-page__note">
            Refunds the full amount through Razorpay and puts the stock back.
            There is no undo.
          </p>
          <Button type="submit" size="sm" variant="ghost" disabled={refunding}>
            {refunding ? "Refunding…" : "Refund in full"}
          </Button>
          {refundState.error ? (
            <p className="drawer__notice drawer__notice--error" role="alert">
              {refundState.error}
            </p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
