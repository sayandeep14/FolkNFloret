import { formatPaise, formatPaiseRange } from "@/lib/money";

/**
 * The only currency in the UI. Takes paise, never rupees, so a price cannot be
 * accidentally rendered a hundred times too small.
 */
export function Money({
  paise,
  to,
  className,
}: {
  paise: number;
  /** Upper bound, for a "from – to" range. */
  to?: number;
  className?: string;
}) {
  const text = to === undefined ? formatPaise(paise) : formatPaiseRange(paise, to);
  // Tabular figures so a column of prices lines up on the decimal.
  return (
    <span className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {text}
    </span>
  );
}
