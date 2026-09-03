import type { Metadata } from "next";
import { ButtonLink, EmptyState } from "@/components/ui";

export const metadata: Metadata = { title: "Your bag — Folks & Florets" };

export default function CartPage() {
  return (
    <EmptyState
      eyebrow="Your bag"
      title="Nothing kept yet"
      body="The bag arrives with Phase 4 of the build. Until then, the collections are worth a look."
      action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
    />
  );
}
