"use client";

import { useActionState } from "react";
import { requestMagicLink, signInWithGoogle, type SignInState } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui";

export function SignInForm({
  providers,
  callbackUrl,
}: {
  providers: { email: boolean; google: boolean };
  callbackUrl: string;
}) {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    requestMagicLink,
    {},
  );

  if (!providers.email && !providers.google) {
    return (
      <p className="drawer__notice" role="status">
        Sign-in is not configured on this deployment yet. Checkout works as a
        guest in the meantime.
      </p>
    );
  }

  return (
    <div className="auth__methods">
      {state.sent ? (
        <p className="drawer__notice" role="status">
          Link sent. Check your inbox — it signs you in once and then expires.
        </p>
      ) : null}

      {providers.email ? (
        <form action={action} className="auth__form">
          <Field
            label="Email"
            error={state.error}
            required
            hint="We will send a sign-in link to this address."
          >
            {(props) => (
              <Input
                {...props}
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
              />
            )}
          </Field>
          <Button type="submit" full disabled={pending}>
            {pending ? "Sending…" : "Email me a link"}
          </Button>
        </form>
      ) : null}

      {providers.email && providers.google ? (
        <p className="auth__or">or</p>
      ) : null}

      {providers.google ? (
        <form action={signInWithGoogle}>
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <Button type="submit" variant="ghost" full>
            Continue with Google
          </Button>
        </form>
      ) : null}
    </div>
  );
}
