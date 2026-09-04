import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, enabledProviders } from "@/auth";
import { Breadcrumb } from "@/components/ui";
import { SignInForm } from "@/components/account/SignInForm";

export const metadata: Metadata = { title: "Sign in — Folks & Florets" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;
  if (session?.user) redirect(callbackUrl ?? "/account");

  return (
    <>
      <Breadcrumb trail={[{ label: "Home", href: "/" }, { label: "Sign in" }]} />
      <div className="auth">
        <p className="eyebrow eyebrow--center">Account</p>
        <h1 className="display display--md">Sign in</h1>
        <p className="lede lede--center">
          No password. We send a link that signs you in, and it expires after
          use.
        </p>

        {error ? (
          <p className="drawer__notice drawer__notice--error" role="alert">
            That sign-in link did not work. Ask for a fresh one.
          </p>
        ) : null}

        <SignInForm
          providers={enabledProviders}
          callbackUrl={callbackUrl ?? "/account"}
        />

        <p className="auth__note">
          You do not need an account to order — checkout works as a guest. An
          account keeps your addresses and your order history.
        </p>
      </div>
    </>
  );
}
