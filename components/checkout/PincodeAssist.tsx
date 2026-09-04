"use client";

import { useState } from "react";

/**
 * Fills city and state from a PIN code. Attached by watching the PIN input
 * rather than owning it, so AddressFields stays the single definition of the
 * address form.
 *
 * Advisory throughout: a failed lookup says nothing and blocks nothing. The
 * fields stay editable, because the Post Office's idea of a district and the
 * customer's idea of their city do not always agree, and theirs is the one on
 * the parcel.
 */
export function PincodeAssist({
  prefix,
  children,
}: {
  prefix: string;
  children: React.ReactNode;
}) {
  const [note, setNote] = useState<string | null>(null);

  const lookup = async (event: React.FormEvent<HTMLDivElement>) => {
    const target = event.target as HTMLInputElement;
    if (target.name !== `${prefix}.pincode`) return;

    const code = target.value.trim();
    if (!/^[1-9][0-9]{5}$/.test(code)) {
      setNote(null);
      return;
    }

    setNote("Looking up…");
    try {
      const response = await fetch(`/api/pincode/${code}`);
      const data = (await response.json()) as {
        found: boolean;
        city?: string;
        state?: string;
      };
      if (!data.found) {
        setNote("We could not place that PIN code — fill in the city yourself.");
        return;
      }

      const form = target.form;
      const city = form?.elements.namedItem(`${prefix}.city`) as HTMLInputElement | null;
      const state = form?.elements.namedItem(`${prefix}.state`) as HTMLSelectElement | null;
      if (city && !city.value) city.value = data.city ?? "";
      if (state && !state.value && data.state) state.value = data.state;

      setNote(`${data.city}, ${data.state}`);
    } catch {
      setNote(null);
    }
  };

  // Wraps the fields rather than sitting beside them: the input event has to
  // bubble up to this handler, and a sibling never sees it.
  return (
    <div onInput={lookup} className="pincode-assist">
      {children}
      {note ? (
        <p className="pincode-assist__note" role="status" aria-live="polite">
          {note}
        </p>
      ) : null}
    </div>
  );
}
