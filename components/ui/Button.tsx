import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

type Variant = "solid" | "ghost" | "quiet";
type Size = "md" | "sm";

function classes(variant: Variant, size: Size, full?: boolean, extra?: string) {
  return [
    "ui-button",
    `ui-button--${variant}`,
    size === "sm" ? "ui-button--sm" : "",
    full ? "ui-button--full" : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

type Shared = {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  children: ReactNode;
};

export function Button({
  variant = "solid",
  size = "md",
  full,
  className,
  children,
  ...rest
}: Shared & ComponentProps<"button">) {
  return (
    <button className={classes(variant, size, full, className)} {...rest}>
      {children}
    </button>
  );
}

/** Same skin, but a real link — so middle-click and open-in-new-tab work. */
export function ButtonLink({
  variant = "solid",
  size = "md",
  full,
  className,
  children,
  ...rest
}: Shared & ComponentProps<typeof Link>) {
  return (
    <Link className={classes(variant, size, full, className)} {...rest}>
      {children}
    </Link>
  );
}
