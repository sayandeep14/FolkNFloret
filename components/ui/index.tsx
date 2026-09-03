import type { ReactNode } from "react";
import Link from "next/link";

export { Button, ButtonLink } from "./Button";
export { Field, Input, Textarea, Select } from "./Field";
export { Money } from "./Money";
export { PlaceholderImage } from "./PlaceholderImage";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "warn";
}) {
  return <span className={`ui-badge ui-badge--${tone}`}>{children}</span>;
}

export function Breadcrumb({
  trail,
}: {
  trail: { label: string; href?: string }[];
}) {
  return (
    <nav className="ui-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {trail.map((crumb, index) => {
          const last = index === trail.length - 1;
          return (
            <li key={crumb.label}>
              {crumb.href && !last ? (
                <Link href={crumb.href}>{crumb.label}</Link>
              ) : (
                <span aria-current={last ? "page" : undefined}>{crumb.label}</span>
              )}
              {last ? null : <b aria-hidden="true">/</b>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function EmptyState({
  eyebrow,
  title,
  body,
  action,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ui-empty">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2 className="ui-empty__title">{title}</h2>
      {body ? <p className="ui-empty__body">{body}</p> : null}
      {action ? <div className="ui-empty__action">{action}</div> : null}
    </div>
  );
}

/** Reserves the space its content will occupy, so nothing jumps on arrival. */
export function Skeleton({
  width = "100%",
  height = "1rem",
  radius = "2px",
}: {
  width?: string;
  height?: string;
  radius?: string;
}) {
  return (
    <span
      className="ui-skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius }}
    />
  );
}
