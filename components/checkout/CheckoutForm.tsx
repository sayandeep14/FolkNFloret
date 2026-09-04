"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitCheckout, type CheckoutState } from "@/app/actions/checkout";
import { AddressFields, type AddressValues } from "@/components/account/AddressFields";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { Button, Field, Input, Textarea } from "@/components/ui";
import { Money } from "@/components/ui/Money";
import type { CartView } from "@/lib/cart-types";
import { PincodeAssist } from "@/components/checkout/PincodeAssist";

/**
 * One page, three sections. Not a wizard: every navigation between steps is a
 * place to abandon, and there is nothing here that needs the previous answer
 * before it can be shown.
 */
export function CheckoutForm({
  cart,
  defaults,
  signedIn,
}: {
  cart: CartView;
  defaults: { email: string; phone: string; address: AddressValues | null };
  signedIn: boolean;
}) {
  const [state, action, pending] = useActionState<CheckoutState, FormData>(
    submitCheckout,
    {},
  );
  const router = useRouter();

  // The order exists on the server; take the customer to it. An effect because
  // this is synchronising with the router, which lives outside React.
  useEffect(() => {
    if (state.orderNumber) router.push(`/checkout/${state.orderNumber}`);
  }, [state.orderNumber, router]);

  const [sameBilling, setSameBilling] = useState(true);
  const [isGift, setIsGift] = useState(false);
  // Read once, in a state initialiser: the clock is impure, and a date picker
  // whose minimum shifts on re-render is worse than one fixed at mount.
  const [earliestDelivery] = useState(() =>
    new Date(Date.now() + 2 * 864e5).toISOString().slice(0, 10),
  );

  return (
    <form action={action} className="checkout">
      <div className="checkout__main">
        <section className="checkout__section">
          <h2>
            <span>1</span> Contact
          </h2>
          {!signedIn ? (
            <p className="checkout__hint">
              Checking out as a guest. <a href="/signin">Sign in</a> if you would
              rather keep your addresses and order history.
            </p>
          ) : null}

          <div className="address-fields__row">
            <Field label="Email" error={state.fieldErrors?.email} required hint="Where the receipt goes.">
              {(p) => (
                <Input {...p} type="email" name="email" defaultValue={defaults.email} autoComplete="email" />
              )}
            </Field>
            <Field label="Mobile" error={state.fieldErrors?.phone} required hint="For delivery updates.">
              {(p) => (
                <Input {...p} name="phone" defaultValue={defaults.phone} inputMode="tel" autoComplete="tel-national" />
              )}
            </Field>
          </div>
        </section>

        <section className="checkout__section">
          <h2>
            <span>2</span> Delivery
          </h2>
          <PincodeAssist prefix="shipping">
            <AddressFields
              prefix="shipping"
              values={defaults.address ?? undefined}
              errors={state.fieldErrors}
              autoCompleteSection="shipping"
            />
          </PincodeAssist>

          <label className="checkbox">
            <input
              type="checkbox"
              name="sameBilling"
              checked={sameBilling}
              onChange={(e) => setSameBilling(e.target.checked)}
            />
            <span>Billing address is the same</span>
          </label>
          {/* A checkbox sends nothing when unchecked, so the server would read
              "absent" as "same". This makes the off state explicit. */}
          {!sameBilling ? <input type="hidden" name="sameBilling" value="off" /> : null}

          {!sameBilling ? (
            <div className="checkout__billing">
              <h3>Billing address</h3>
              <AddressFields prefix="billing" errors={state.fieldErrors} autoCompleteSection="billing" />
            </div>
          ) : null}
        </section>

        <section className="checkout__section">
          <h2>
            <span>3</span> The gift
          </h2>
          <p className="checkout__hint">
            This is a gifting house. If this is going to someone else, we will
            pack it accordingly.
          </p>

          <label className="checkbox">
            <input
              type="checkbox"
              name="isGift"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
            />
            <span>This is a gift</span>
          </label>

          {isGift ? (
            <div className="checkout__gift">
              <Field label="Recipient's name" error={state.fieldErrors?.["gift.recipient"]}>
                {(p) => <Input {...p} name="giftRecipient" placeholder="Who it is for" />}
              </Field>

              <Field
                label="Message for the card"
                error={state.fieldErrors?.["gift.message"]}
                hint="Handwritten onto the card, up to 300 characters."
              >
                {(p) => <Textarea {...p} name="giftMessage" maxLength={300} />}
              </Field>

              <label className="checkbox">
                <input type="checkbox" name="giftHidePrices" defaultChecked />
                <span>Leave prices out of the parcel</span>
              </label>

              <Field label="Preferred delivery date" hint="We will do our best; not a guarantee.">
                {(p) => (
                  <Input
                    {...p}
                    type="date"
                    name="requestedFor"
                    min={earliestDelivery}
                  />
                )}
              </Field>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="checkout__summary">
        <h2>Your bag</h2>
        <ul className="checkout__lines">
          {cart.lines.map((line) => (
            <li key={line.id}>
              <span>
                {line.title}
                {line.variantName ? <em>{line.variantName}</em> : null}
                <small>×{line.quantity}</small>
              </span>
              <Money paise={line.unitPriceInPaise * line.quantity} />
            </li>
          ))}
        </ul>

        <OrderSummary summary={cart.summary} discountCode={cart.discountCode} />

        {state.error ? (
          <p className="drawer__notice drawer__notice--error" role="alert">
            {state.error}
          </p>
        ) : null}

        <Button type="submit" full disabled={pending || Boolean(state.orderNumber)}>
          {state.orderNumber ? "Taking you there…" : pending ? "Reserving…" : "Place order"}
        </Button>

        <p className="cart-page__note">
          Placing the order holds your pieces for fifteen minutes. Payment opens
          on the next page. Prices include GST.
        </p>
      </aside>
    </form>
  );
}
