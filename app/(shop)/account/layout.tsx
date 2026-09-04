import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/account";
import { Breadcrumb } from "@/components/ui";
import { SignOutButton } from "@/components/account/SignOutButton";

export const dynamic = "force-dynamic";

const tabs = [
  { href: "/account", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware only checks that a session cookie exists. This is the real
  // check, and it also catches a cookie whose session has been revoked.
  const user = await currentUser();
  if (!user) redirect("/signin?callbackUrl=/account");

  return (
    <>
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Account" }]} />

      <header className="account__head">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="display display--md">{user.name ?? user.email}</h1>
        </div>
        <SignOutButton />
      </header>

      <nav className="account__tabs" aria-label="Account">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            {tab.label}
          </Link>
        ))}
      </nav>

      {children}
    </>
  );
}
