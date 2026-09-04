import { NextResponse } from "next/server";
import {
  addItem,
  applyDiscount,
  getCart,
  removeItem,
  updateQuantity,
} from "./operations";

/**
 * The bag's HTTP surface.
 *
 * Deliberately a route handler rather than a Server Action. Actions invoked
 * from a statically prerendered page execute on the server and then never
 * resolve on the client — and since every product page is prerendered, that
 * covered every add-to-bag on the site. Route handlers do not care how the
 * page that called them was rendered.
 *
 * One endpoint with a discriminated body rather than four: the cart has one
 * contract, and keeping it in one place is worth more than the URLs being
 * individually RESTful.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await getCart());
}

type Body =
  | { op: "add"; variantId: string; quantity?: number }
  | { op: "update"; itemId: string; quantity: number }
  | { op: "remove"; itemId: string }
  | { op: "discount"; code: string };

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "malformed" }, { status: 400 });
  }

  switch (body?.op) {
    case "add":
      if (typeof body.variantId !== "string") break;
      return NextResponse.json(await addItem(body.variantId, body.quantity ?? 1));

    case "update":
      if (typeof body.itemId !== "string" || typeof body.quantity !== "number") break;
      return NextResponse.json(await updateQuantity(body.itemId, body.quantity));

    case "remove":
      if (typeof body.itemId !== "string") break;
      return NextResponse.json(await removeItem(body.itemId));

    case "discount":
      if (typeof body.code !== "string") break;
      return NextResponse.json(await applyDiscount(body.code));
  }

  return NextResponse.json({ error: "unknown operation" }, { status: 400 });
}
