"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { damp } from "@/lib/math";
import { scrollState } from "@/lib/scroll-store";

gsap.registerPlugin(ScrollTrigger);

/** Scroll speed, in px/frame, that counts as "as fast as it gets". */
const VELOCITY_CEILING = 55;
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

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

    // Velocity is eased toward the raw reading and decays back to rest, so the
    // scene reacts to how hard the page is moving without ever snapping.
    let rawVelocity = 0;
    const easeVelocity = () => {
      const delta = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);
      scrollState.velocity +=
        (rawVelocity - scrollState.velocity) * damp(delta, 6);
      rawVelocity *= 0.86;
    };
    gsap.ticker.add(easeVelocity);

    // With reduced motion we hand scrolling back to the browser entirely.
    if (query.matches) {
      ScrollTrigger.refresh();
      return () => {
        gsap.ticker.remove(easeVelocity);
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

    lenis.on("scroll", (instance: { velocity: number }) => {
      rawVelocity = clamp(instance.velocity / VELOCITY_CEILING);
      ScrollTrigger.update();
    });
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(easeVelocity);
      gsap.ticker.remove(tick);
      query.removeEventListener("change", onPreferenceChange);
      window.removeEventListener("pointermove", onPointerMove);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
