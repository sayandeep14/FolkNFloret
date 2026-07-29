"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { damp } from "@/lib/math";
import { scrollState } from "@/lib/scroll-store";

gsap.registerPlugin(ScrollTrigger);

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/** Scroll speed, in px/frame, that counts as "as fast as it gets". */
const VELOCITY_CEILING = 55;

/**
 * Owns the single Lenis instance, feeds GSAP, and derives the two continuous
 * inputs the shaders read every frame: scroll velocity and pointer position.
 * Nothing else on the page should touch Lenis.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    scrollState.reducedMotion = query.matches;

    const onPreferenceChange = (event: MediaQueryListEvent) => {
      scrollState.reducedMotion = event.matches;
    };
    query.addEventListener("change", onPreferenceChange);

    // Pointer is tracked in raw form here and eased on the ticker below, so a
    // jittery mouse never translates into a jittery ripple.
    let targetUvX = 0.5;
    let targetUvY = 0.5;
    let lastX = 0;
    let lastY = 0;
    let rawSpeed = 0;

    const onPointerMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      rawSpeed = Math.min(
        1,
        Math.hypot(x - lastX, y - lastY) * 14,
      );
      lastX = x;
      lastY = y;
      targetUvX = x;
      // UV origin is bottom-left; the DOM's is top-left.
      targetUvY = 1 - y;
      scrollState.pointerX = x * 2 - 1;
      scrollState.pointerY = y * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let rawVelocity = 0;

    const ease = () => {
      const delta = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);
      const k = damp(delta, 9);
      scrollState.uvX += (targetUvX - scrollState.uvX) * k;
      scrollState.uvY += (targetUvY - scrollState.uvY) * k;
      // Pointer speed decays on its own; move events only ever push it up.
      rawSpeed *= 0.9;
      scrollState.pointerSpeed +=
        (rawSpeed - scrollState.pointerSpeed) * damp(delta, 7);
      // Velocity settles back to rest whenever scrolling stops.
      scrollState.velocity +=
        (rawVelocity - scrollState.velocity) * damp(delta, 6);
      rawVelocity *= 0.86;
    };
    gsap.ticker.add(ease);

    if (query.matches) {
      // Reduced motion: hand scrolling back to the browser entirely and leave
      // velocity at rest so nothing distorts.
      ScrollTrigger.refresh();
      return () => {
        gsap.ticker.remove(ease);
        query.removeEventListener("change", onPreferenceChange);
        window.removeEventListener("pointermove", onPointerMove);
      };
    }

    const lenis = new Lenis({
      duration: 1.25,
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.3,
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
      gsap.ticker.remove(ease);
      gsap.ticker.remove(tick);
      query.removeEventListener("change", onPreferenceChange);
      window.removeEventListener("pointermove", onPointerMove);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}