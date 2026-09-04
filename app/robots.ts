import type { MetadataRoute } from "next";

/**
 * The studio lives on its own hostname and is behind a role check, so it
 * should never be reachable by a crawler in the first place. This is the third
 * layer anyway: `Disallow` costs nothing, and the day someone leaves a link to
 * an order page in a public place, it is the thing that stops it being indexed.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/studio", "/account", "/checkout", "/cart", "/track", "/api/"],
      },
    ],
    // No sitemap line until there is a sitemap — pointing a crawler at a 404
    // is worse than saying nothing. Phase 10 adds one.
  };
}
