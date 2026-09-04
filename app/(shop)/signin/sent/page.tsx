import type { Metadata } from "next";
import { ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Check your inbox — Folks & Florets" };

export default function VerifyRequestPage() {
  return (
    <EmptyState
      eyebrow="Sign in"
      title="Check your inbox"
      body="We have sent you a link. It signs you in once and then expires — if it does not arrive within a minute, look in spam and then ask for another."
      action={<ButtonLink href="/signin" variant="ghost">Send another</ButtonLink>}
    />
  );
}
