"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { damp } from "@/lib/math";
import { scrollState } from "@/lib/scroll-store";

/**
 * A two-part cursor: a small dot that tracks exactly, and a ring that lags
 * behind and swells over anything interactive. Suppressed on touch devices and
 * under reduced motion, where the native cursor is left alone.
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      scrollState.reducedMotion ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    document.body.classList.add("has-custom-cursor");

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let ringX = x;
    let ringY = y;
    let scale = 1;
    let targetScale = 1;
    let seen = false;

    gsap.set([dot, ring], { autoAlpha: 0 });

    const setDot = gsap.quickSetter(dot, "css") as (v: object) => void;
    const setRing = gsap.quickSetter(ring, "css") as (v: object) => void;

    const onMove = (event: PointerEvent) => {
      // Stays hidden until the pointer actually moves, so it never appears
      // parked in the middle of the viewport on load.
      if (!seen) {
        seen = true;
        ringX = event.clientX;
        ringY = event.clientY;
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.4 });
      }
      x = event.clientX;
      y = event.clientY;

      const interactive = (event.target as Element | null)?.closest?.(
        "a, button, [data-cursor]",
      );
      targetScale = interactive ? 2.3 : 1;
      ring.dataset.active = interactive ? "true" : "false";
    };

    const tick = () => {
      const delta = Math.min(gsap.ticker.deltaRatio(60) / 60, 0.05);
      const k = damp(delta, 12);
      ringX += (x - ringX) * k;
      ringY += (y - ringY) * k;
      scale += (targetScale - scale) * damp(delta, 10);

      setDot({ x, y });
      setRing({ x: ringX, y: ringY, scale });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    gsap.ticker.add(tick);

    return () => {
      document.body.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      gsap.ticker.remove(tick);
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div ref={ringRef} className="cursor__ring" />
      <div ref={dotRef} className="cursor__dot" />
    </div>
  );
}
