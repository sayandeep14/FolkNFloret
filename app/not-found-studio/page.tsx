import { notFound } from "next/navigation";

/**
 * The storefront's answer to /studio: the same 404 any unknown path gets.
 * A redirect or a "forbidden" would confirm the studio exists and say where
 * to look for it.
 */
export default function StudioNotHere() {
  notFound();
}
