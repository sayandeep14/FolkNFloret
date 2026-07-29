"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { scrollState } from "@/lib/scroll-store";

/**
 * Pulls its child toward the pointer while hovered, then springs back. The
 * child's own content is offset half as far as the wrapper, which is what makes
 * it feel like the element is leaning rather than sliding.
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || scrollState.reducedMotion) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const inner = element.firstElementChild;
    const quickX = gsap.quickTo(element, "x", { duration: 0.5, ease: "power3" });
    const quickY = gsap.quickTo(element, "y", { duration: 0.5, ease: "power3" });
    const innerX = inner
      ? gsap.quickTo(inner, "x", { duration: 0.6, ease: "power3" })
      : null;
    const innerY = inner
      ? gsap.quickTo(inner, "y", { duration: 0.6, ease: "power3" })
      : null;

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const dx = (event.clientX - (rect.left + rect.width / 2)) * strength;
      const dy = (event.clientY - (rect.top + rect.height / 2)) * strength;
      quickX(dx);
      quickY(dy);
      innerX?.(dx * 0.5);
      innerY?.(dy * 0.5);
    };

    const onLeave = () => {
      quickX(0);
      quickY(0);
      innerX?.(0);
      innerY?.(0);
    };

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);

    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
    };
  }, [strength]);

  return (
    <span ref={ref} className={className} data-cursor>
      {children}
    </span>
  );
}
