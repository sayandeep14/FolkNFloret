import { ButtonLink, EmptyState } from "@/components/ui";

export default function ShopNotFound() {
  return (
    <EmptyState
      eyebrow="Not found"
      title="Nothing here"
      body="The page you were after has moved or never existed."
      action={<ButtonLink href="/shop">Browse the shop</ButtonLink>}
    />
  );
}
