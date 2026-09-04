"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { lookupOrder, type TrackState } from "@/app/actions/track";
import { Button, Field, Input } from "@/components/ui";

export function TrackForm({
  notFound,
  defaults,
}: {
  notFound: boolean;
  defaults: { order: string; email: string };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<TrackState, FormData>(lookupOrder, {});

  // The found order lives at its own URL, so it can be bookmarked and so our
  // emails can link straight to it.
  useEffect(() => {
    if (state.orderNumber && state.email) {
      router.push(
        `/track?order=${encodeURIComponent(state.orderNumber)}&email=${encodeURIComponent(state.email)}`,
      );
    }
  }, [state.orderNumber, state.email, router]);

  return (
    <form action={action} className="auth__form" style={{ marginTop: "2rem", textAlign: "left" }}>
      {notFound && !state.error ? (
        <p className="drawer__notice drawer__notice--error" role="alert">
          We could not find an order with that number and email.
        </p>
      ) : null}

      <Field label="Order number" error={state.error} required hint="Looks like FF-XXXX-XXXX.">
        {(p) => (
          <Input {...p} name="order" defaultValue={defaults.order} placeholder="FF-" autoComplete="off" />
        )}
      </Field>

      <Field label="Email" required>
        {(p) => (
          <Input {...p} type="email" name="email" defaultValue={defaults.email} autoComplete="email" />
        )}
      </Field>

      <Button type="submit" full disabled={pending}>
        {pending ? "Looking…" : "Find my order"}
      </Button>
    </form>
  );
}
