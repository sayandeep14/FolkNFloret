/**
 * The absolute origin this deployment is served from. Needed by `metadataBase`
 * so Open Graph images resolve to a real URL — without it Next falls back to
 * localhost, and every share card on WhatsApp, Slack and Twitter comes back
 * broken while looking fine locally.
 *
 * Resolution order, most explicit first:
 *   NEXT_PUBLIC_SITE_URL          a custom domain, once there is one
 *   VERCEL_PROJECT_PRODUCTION_URL the stable production domain (production only)
 *   VERCEL_URL                    this deployment, so previews share correctly
 *   localhost                     development
 */
function origin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  if (
    process.env.VERCEL_ENV === "production" &&
    process.env.VERCEL_PROJECT_PRODUCTION_URL
  ) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  return "http://localhost:3000";
}

export const SITE_URL = origin();
