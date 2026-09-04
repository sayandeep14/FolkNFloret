import type { Metadata } from "next";
import { requireUser } from "@/lib/account";
import { ProfileForm } from "@/components/account/ProfileForm";

export const metadata: Metadata = { title: "Profile — Folks & Florets" };

export default async function ProfilePage() {
  const user = await requireUser();
  return (
    <ProfileForm
      email={user.email}
      name={user.name}
      phone={user.phone}
      marketingOptIn={user.marketingOptIn}
    />
  );
}
