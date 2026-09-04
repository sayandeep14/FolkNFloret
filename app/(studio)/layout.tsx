import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import "../studio.css";
import { currentStaff } from "@/lib/staff";
import { SignOutButton } from "@/components/account/SignOutButton";

/**
 * The studio wears its own clothes: the shop's tokens and primitives, laid out
 * denser and without the shopfront. No WebGL, no smooth scroll, no cart — this
 * is a tool used at a desk with a printer, and every one of those would be
 * weight in the way.
 */
export const metadata: Metadata = {
  title: { default: "Studio", template: "%s — Studio" },
  // Belt and braces with robots.txt. An internal tool has no business in an
  // index, and the pages behind it are order records.
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/studio", label: "Orders" },
];

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware only checks that a session cookie exists — Prisma cannot run on
  // the edge. This is the real gate, and it also catches a revoked session and
  // a customer who found the address.
  const staff = await currentStaff();
  if (!staff) redirect("/signin?callbackUrl=/studio");

  return (
    <div className="studio">
      <header className="studio__bar">
        <Link className="studio__mark" href="/studio">
          Folks <i aria-hidden="true">&amp;</i> Florets
          <span>Studio</span>
        </Link>

        <nav aria-label="Studio">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="studio__who">
          <span>{staff.name ?? staff.email}</span>
          <SignOutButton />
        </div>
      </header>

      <main className="studio__main">{children}</main>
    </div>
  );
}
