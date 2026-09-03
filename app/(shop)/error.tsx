"use client";

import { useEffect } from "react";
import { Button, EmptyState } from "@/components/ui";

export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replaced by Sentry in Phase 11; until then at least it is not silent.
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      eyebrow="Something went wrong"
      title="That did not load"
      body="The fault is ours. Try again, and if it persists, write to us and we will sort it."
      action={<Button onClick={reset}>Try again</Button>}
    />
  );
}
