import { NextResponse } from "next/server";

/**
 * PIN code → city and state, so nobody types their own district into a form
 * that already knows it.
 *
 * Proxied rather than called from the browser: the upstream is plain HTTP-ish
 * public API with no CORS guarantees, and going through our own route lets the
 * answer be cached. Treated as advisory throughout — if it is down, checkout
 * carries on with whatever the customer typed, because a courier lookup being
 * unavailable is not a reason to refuse an order.
 */
export const revalidate = 86400;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!/^[1-9][0-9]{5}$/.test(code)) {
    return NextResponse.json({ found: false }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${code}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return NextResponse.json({ found: false });

    const body = (await response.json()) as {
      Status: string;
      PostOffice?: { District: string; State: string }[] | null;
    }[];
    const office = body?.[0]?.PostOffice?.[0];
    if (body?.[0]?.Status !== "Success" || !office) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      city: office.District,
      state: office.State,
    });
  } catch {
    // Timeout, DNS, upstream outage — all the same to the caller.
    return NextResponse.json({ found: false });
  }
}
