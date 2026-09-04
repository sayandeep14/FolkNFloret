"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { withinLimit } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SignInState = { error?: string; sent?: boolean };

/**
 * Magic-link request. Rate limited on two keys at once: the address, so one
 * inbox cannot be flooded, and the caller's IP, so one attacker cannot walk a
 * list of addresses. An unknown address gets the same answer as a known one —
 * telling a stranger which emails have accounts is a disclosure, not a
 * convenience.
 */
export async function requestMagicLink(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL.test(email)) return { error: "That does not look like an email address." };

  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";

  const [emailOk, ipOk] = await Promise.all([
    withinLimit(`signin:email:${email}`, 3, 15 * 60),
    withinLimit(`signin:ip:${ip}`, 10, 15 * 60),
  ]);

  if (!emailOk || !ipOk) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  try {
    await signIn("resend", { email, redirect: false });
    return { sent: true };
  } catch (error) {
    if (error instanceof AuthError) return { error: "Could not send that link." };
    throw error;
  }
}

export async function signInWithGoogle(formData: FormData) {
  const callbackUrl = String(formData.get("callbackUrl") ?? "/account");
  await signIn("google", { redirectTo: callbackUrl });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
