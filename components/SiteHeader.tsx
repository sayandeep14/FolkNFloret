"use client";

import { useEffect, useRef, useState } from "react";
import { brand, nav } from "@/lib/content";
import { scrollState } from "@/lib/scroll-store";

export function SiteHeader() {
  const [condensed, setCondensed] = useState(false);
  const [inverted, setInverted] = useState(false);
  const frame = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      // rAF-gated: scroll fires far more often than we need to flip a class.
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        setCondensed(window.scrollY > window.innerHeight * 0.6);
        // Tied to the palette rather than to a pixel offset: this is the point
        // where the backdrop has gone dark enough to need light type.
        setInverted(scrollState.u > 1.45);
        frame.current = 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  return (
    <header
      className={[
        "site-header",
        condensed ? "is-condensed" : "",
        inverted ? "is-inverted" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <a className="site-header__mark" href="#top">
        <span>Folk</span>
        <i aria-hidden="true">&amp;</i>
        <span>Floret</span>
      </a>

      <p className="site-header__note">{brand.note}</p>

      <nav className="site-header__nav" aria-label="Primary">
        {nav.map((item) => (
          <a key={item.href} href={item.href}>
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
