"use client";

import { useActionState } from "react";
import { saveProfile, type FormState } from "@/app/actions/account";
import { Button, Field, Input } from "@/components/ui";

export function ProfileForm({
  email,
  name,
  phone,
  marketingOptIn,
}: {
  email: string;
  name: string | null;
  phone: string | null;
  marketingOptIn: boolean;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});

  return (
    <form action={action} className="profile-form">
      <Field label="Email" hint="Changing this would change how you sign in — write to us.">
        {(p) => <Input {...p} value={email} readOnly disabled />}
      </Field>

      <Field label="Name" error={state.fieldErrors?.name}>
        {(p) => <Input {...p} name="name" defaultValue={name ?? ""} autoComplete="name" />}
      </Field>

      <Field label="Mobile" error={state.fieldErrors?.phone}>
        {(p) => (
          <Input {...p} name="phone" defaultValue={phone ?? ""} inputMode="tel" autoComplete="tel-national" />
        )}
      </Field>

      <label className="checkbox">
        <input type="checkbox" name="marketingOptIn" defaultChecked={marketingOptIn} />
        <span>Write to me when something new is composed. Rarely, and never a sale.</span>
      </label>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {state.ok ? <span className="profile-form__saved" role="status">Saved.</span> : null}
      </div>
    </form>
  );
}
