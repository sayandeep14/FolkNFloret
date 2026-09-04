"use client";

import { Field, Input, Select } from "@/components/ui";
import { INDIAN_STATES } from "@/lib/address";

export type AddressValues = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  landmark?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  phone?: string | null;
};

/**
 * The address form body, shared by the account book and by checkout so the two
 * cannot drift. `prefix` namespaces the field names where a page has two of
 * them on screen at once — delivery and billing.
 */
export function AddressFields({
  values,
  errors,
  prefix = "",
  autoCompleteSection,
}: {
  values?: AddressValues;
  errors?: Record<string, string>;
  prefix?: string;
  /** "shipping" or "billing", so browsers offer the right saved address. */
  autoCompleteSection?: "shipping" | "billing";
}) {
  const n = (field: string) => (prefix ? `${prefix}.${field}` : field);
  const e = (field: string) => errors?.[prefix ? `${prefix}.${field}` : field];
  const ac = (token: string) =>
    autoCompleteSection ? `${autoCompleteSection} ${token}` : token;

  return (
    <div className="address-fields">
      <Field label="Full name" error={e("name")} required>
        {(p) => (
          <Input {...p} name={n("name")} defaultValue={values?.name ?? ""} autoComplete={ac("name")} />
        )}
      </Field>

      <Field label="Address" error={e("line1")} required>
        {(p) => (
          <Input
            {...p}
            name={n("line1")}
            defaultValue={values?.line1 ?? ""}
            autoComplete={ac("address-line1")}
            placeholder="Flat, house, building, street"
          />
        )}
      </Field>

      <Field label="Area" error={e("line2")}>
        {(p) => (
          <Input
            {...p}
            name={n("line2")}
            defaultValue={values?.line2 ?? ""}
            autoComplete={ac("address-line2")}
            placeholder="Locality, area"
          />
        )}
      </Field>

      <Field label="Landmark" error={e("landmark")} hint="Optional, but couriers use it.">
        {(p) => (
          <Input {...p} name={n("landmark")} defaultValue={values?.landmark ?? ""} />
        )}
      </Field>

      <div className="address-fields__row">
        <Field label="PIN code" error={e("pincode")} required>
          {(p) => (
            <Input
              {...p}
              name={n("pincode")}
              defaultValue={values?.pincode ?? ""}
              inputMode="numeric"
              maxLength={6}
              autoComplete={ac("postal-code")}
            />
          )}
        </Field>

        <Field label="City" error={e("city")} required>
          {(p) => (
            <Input {...p} name={n("city")} defaultValue={values?.city ?? ""} autoComplete={ac("address-level2")} />
          )}
        </Field>
      </div>

      <Field label="State" error={e("state")} required>
        {(p) => (
          <Select {...p} name={n("state")} defaultValue={values?.state ?? ""} autoComplete={ac("address-level1")}>
            <option value="">Choose a state</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Field label="Mobile" error={e("phone")} required hint="For delivery updates.">
        {(p) => (
          <Input
            {...p}
            name={n("phone")}
            defaultValue={values?.phone ?? ""}
            inputMode="tel"
            autoComplete={ac("tel-national")}
            placeholder="98765 43210"
          />
        )}
      </Field>
    </div>
  );
}
