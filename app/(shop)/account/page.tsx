import type { Metadata } from "next";
import { ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Account — Folks & Florets" };

export default function AccountPage() {
  return (
    <EmptyState
      eyebrow="Account"
      title="Accounts are not open yet"
      body="Sign-in, order history and your address book arrive with Phase 5. Commissions are taken by conversation in the meantime."
      action={
        <ButtonLink href="/#invitation" variant="ghost">
          Start a commission
        </ButtonLink>
      }
    />
  );
}
