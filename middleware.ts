import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate for /account/*. Deliberately a cookie presence check rather than a full
 * session lookup: middleware runs on the edge for every matched request, and
 * Prisma cannot run there. The pages themselves call `auth()` and are the real
 * authority — this only saves an unauthenticated visitor a round trip and
 * sends them somewhere useful.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(request: NextRequest) {
  const signedIn = SESSION_COOKIES.some((name) =>
    request.cookies.has(name),
  );
  if (signedIn) return NextResponse.next();

  const url = new URL("/signin", request.url);
  url.searchParams.set(
    "callbackUrl",
    request.nextUrl.pathname + request.nextUrl.search,
  );
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/account/:path*"] };
