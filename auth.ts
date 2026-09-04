import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import type { Provider } from "next-auth/providers";
import { db } from "@/lib/db";
import { mergeIntoUser } from "@/lib/cart";

/**
 * Providers are assembled from whatever credentials are actually present.
 *
 * A missing key must not take the site down — the shop, the catalogue and the
 * bag all work perfectly well without anyone being able to sign in, and a
 * deploy that has not been given a Resend key yet should degrade to "sign-in
 * unavailable" rather than to a 500 on every page that reads a session.
 * `enabledProviders` lets the sign-in page say which methods are live.
 */
function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.AUTH_RESEND_KEY) {
    providers.push(
      Resend({
        apiKey: process.env.AUTH_RESEND_KEY,
        from: process.env.EMAIL_FROM ?? "hello@folknfloret.com",
        name: "Email",
      }),
    );
  }

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    providers.push(
      Google({
        clientId: process.env.AUTH_GOOGLE_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    );
  }

  return providers;
}

export const enabledProviders = {
  email: Boolean(process.env.AUTH_RESEND_KEY),
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  providers: buildProviders(),
  // Database sessions rather than JWT: magic links need the adapter anyway,
  // and a session row can be revoked, which a signed token cannot.
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/signin", verifyRequest: "/signin/sent", error: "/signin" },
  callbacks: {
    session({ session, user }) {
      // The app addresses users by id everywhere — orders, addresses, carts.
      session.user.id = user.id;
      session.user.role = (user as { role?: string }).role ?? "CUSTOMER";
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Whatever they put in the bag before signing in comes with them.
      if (user.id) await mergeIntoUser(user.id);
    },
  },
  trustHost: true,
});
