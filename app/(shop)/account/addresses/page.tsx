import type { Metadata } from "next";
import { listAddresses, requireUser } from "@/lib/account";
import { AddressBook } from "@/components/account/AddressBook";

export const metadata: Metadata = { title: "Addresses — Folks & Florets" };

export default async function AddressesPage() {
  const user = await requireUser();
  return <AddressBook addresses={await listAddresses(user.id)} />;
}
