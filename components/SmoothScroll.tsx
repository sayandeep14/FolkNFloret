"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { scrollState } from "@/lib/scroll-store";

gsap.registerPlugin(ScrollTrigger);

/**
 * Owns the single Lenis instance and hands scroll ticks to GSAP. Everything
 * else on the page reacts to ScrollTrigger; nothing else should touch Lenis.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    scrollState.reducedMotion = query.matches;

    const onPreferenceChange = (event: MediaQueryListEvent) => {
      scrollState.reducedMotion = event.matches;
    };
    query.addEventListener("change", onPreferenceChange);

    const onPointerMove = (event: PointerEvent) => {
      scrollState.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointerY = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // With reduced motion we hand scrolling back to the browser entirely.
    if (query.matches) {
      ScrollTrigger.refresh();
      return () => {
        query.removeEventListener("change", onPreferenceChange);
        window.removeEventListener("pointermove", onPointerMove);
      };
    }

    const lenis = new Lenis({
      duration: 1.35,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.2,
    });

    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      query.removeEventListener("change", onPreferenceChange);
      window.removeEventListener("pointermove", onPointerMove);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
