import { NextResponse, type NextRequest } from "next/server";
import { isStudioHost } from "@/lib/hosts";

/**
 * One deployment, two faces.
 *
 * The studio is not a second application — it shares the schema, the order
 * state machine, the pricing and the primitives, and a copy of all that would
 * drift. It is the same code answering on a different hostname, and this is
 * where the two are told apart.
 *
 * Three jobs:
 *
 *  1. On the studio host, serve the `/studio/*` routes from the root, so
 *     studio.folknfloret.com/orders/FF-… works.
 *  2. On the storefront hosts, **404 `/studio/*`** — the admin exists at
 *     exactly one address, and a second door is a second thing to defend.
 *  3. Keep `/account/*` behind a session cookie.
 *
 * Worth being clear about what this does not do: a hostname is not a security
 * boundary. The role check in `lib/staff.ts` is what actually protects the
 * studio, and a network gate in front of the subdomain is what makes a stolen
 * cookie survivable. This only ensures there is one door to gate.
 */

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

/** Auth has to answer on both hosts: staff sign in on the studio's own host. */
function isAlwaysAllowed(pathname: string): boolean {
  return (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt"
  );
}

function requireSession(request: NextRequest): NextResponse | null {
  const signedIn = SESSION_COOKIES.some((name) => request.cookies.has(name));
  if (signedIn) return null;

  const url = new URL("/signin", request.url);
  url.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isStudioHost(request.headers.get("host"))) {
    if (isAlwaysAllowed(pathname)) return NextResponse.next();

    // Sign-in and its error states have to be reachable, or nobody can get in.
    if (pathname.startsWith("/signin")) return NextResponse.next();

    const guard = requireSession(request);
    if (guard) return guard;

    // Links inside the studio are written as /studio/… so the same components
    // work at either address; typed URLs without the prefix work too.
    if (pathname === "/studio" || pathname.startsWith("/studio/")) {
      return NextResponse.next();
    }
    return NextResponse.rewrite(
      new URL(`/studio${pathname === "/" ? "" : pathname}${search}`, request.url),
    );
  }

  // Storefront hosts: the studio is not here.
  if (pathname === "/studio" || pathname.startsWith("/studio/")) {
    return NextResponse.rewrite(new URL("/not-found-studio", request.url));
  }

  if (pathname.startsWith("/account")) {
    return requireSession(request) ?? NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Everything except static assets — host routing has to see each request.
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|svg|ico|webp|avif|woff2?)$).*)"],
};
