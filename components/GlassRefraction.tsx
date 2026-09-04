"use client";

import { useEffect } from "react";

/**
 * Turns the navbar's SVG refraction on, and only where it has been verified.
 *
 * The CSS used to gate it on
 * `@supports (backdrop-filter: url("#liquid-glass"))`, which looked principled
 * and is wrong: WebKit answers **true** to that query and then applies the
 * filter for real — an feImage plus two chained feDisplacementMap passes, as a
 * backdrop-filter, on a fixed element, over a continuously repainting WebGL
 * canvas. That is a compositor path Safari handles badly, and it is the
 * strongest candidate for the WebContent process crash that blanked the page
 * on macOS Safari and iOS.
 *
 * `@supports` cannot tell "parses" from "renders acceptably", so the gate has
 * to name what it means. The effect is decoration: everything without it keeps
 * the clear-blur bar, which is what Safari and Firefox saw anyway whenever the
 * filter failed to resolve.
 */
export function GlassRefraction() {
  useEffect(() => {
    // userAgentData is Chromium-only, which is exactly the question being
    // asked — no version parsing, and no UA string to be spoofed into a crash.
    const brands = (
      navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }
    ).userAgentData?.brands;
    const chromium = brands?.some((b) => b.brand === "Chromium") ?? false;

    if (!chromium) return;
    document.documentElement.classList.add("has-glass-refraction");
    return () => document.documentElement.classList.remove("has-glass-refraction");
  }, []);

  return null;
}
