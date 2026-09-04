"use client";

import { useActionState, useState } from "react";
import {
  deleteAddress,
  makeDefaultAddress,
  saveAddress,
  type FormState,
} from "@/app/actions/account";
import { AddressFields } from "@/components/account/AddressFields";
import { Badge, Button } from "@/components/ui";
import { formatAddress } from "@/lib/address";

type Address = {
  id: string;
  name: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
};

export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [state, action, pending] = useActionState<FormState, FormData>(saveAddress, {});

  return (
    <div className="address-book">
      <ul>
        {addresses.map((address) => (
          <li key={address.id}>
            {editing === address.id ? (
              <form action={action} className="address-book__form">
                <input type="hidden" name="id" value={address.id} />
                <AddressFields values={address} errors={state.fieldErrors} />
                <div className="address-book__actions">
                  <Button type="submit" size="sm" disabled={pending}>
                    {pending ? "Saving…" : "Save"}
                  </Button>
                  <Button type="button" size="sm" variant="quiet" onClick={() => setEditing(null)}>
                    {state.ok ? "Done" : "Cancel"}
                  </Button>
                  {state.ok ? (
                    <span className="profile-form__saved" role="status">
                      Saved.
                    </span>
                  ) : null}
                </div>
              </form>
            ) : (
              <>
                <div>
                  <p className="address-book__name">
                    {address.name}
                    {address.isDefault ? <Badge tone="gold">Default</Badge> : null}
                  </p>
                  <p className="address-book__body">{formatAddress(address)}</p>
                  <p className="address-book__body">{address.phone}</p>
                </div>
                <div className="address-book__actions">
                  <Button type="button" size="sm" variant="quiet" onClick={() => setEditing(address.id)}>
                    Edit
                  </Button>
                  {address.isDefault ? null : (
                    <form action={makeDefaultAddress}>
                      <input type="hidden" name="id" value={address.id} />
                      <Button type="submit" size="sm" variant="quiet">
                        Make default
                      </Button>
                    </form>
                  )}
                  <form action={deleteAddress}>
                    <input type="hidden" name="id" value={address.id} />
                    <Button type="submit" size="sm" variant="quiet">
                      Delete
                    </Button>
                  </form>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {editing === "new" ? (
        <form action={action} className="address-book__form">
          <AddressFields errors={state.fieldErrors} />
          <div className="address-book__actions">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "Saving…" : "Add address"}
            </Button>
            <Button type="button" size="sm" variant="quiet" onClick={() => setEditing(null)}>
              {state.ok ? "Done" : "Cancel"}
            </Button>
            {state.ok ? (
              <span className="profile-form__saved" role="status">
                Saved.
              </span>
            ) : null}
          </div>
        </form>
      ) : (
        <Button type="button" variant="ghost" onClick={() => setEditing("new")}>
          Add an address
        </Button>
      )}
    </div>
  );
}
