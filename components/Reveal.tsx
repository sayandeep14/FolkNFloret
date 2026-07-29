"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState } from "@/lib/scroll-store";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Stagger direct children instead of animating the wrapper as one block. */
  stagger?: boolean;
  delay?: number;
};

/**
 * The standard entrance for DOM content below the journey: a short rise with a
 * blur lift. Deliberately restrained — the 3D layer is the drama, this is not.
 *
 * Always renders a div. Callers needing other semantics wrap it (see Craft,
 * where each Reveal sits inside its own <li>).
 */
export function Reveal({ children, className, stagger = false, delay = 0 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (scrollState.reducedMotion) {
      gsap.set(element, { autoAlpha: 1, visibility: "visible" });
      if (stagger) gsap.set(element.children, { autoAlpha: 1, y: 0 });
      return;
    }

    // In stagger mode the children are animated, so the wrapper's own inline
    // visibility has to be lifted separately or it hides them all.
    if (stagger) gsap.set(element, { visibility: "visible" });

    const targets = stagger ? Array.from(element.children) : element;

    const animation = gsap.fromTo(
      targets,
      { autoAlpha: 0, y: 34, filter: "blur(7px)" },
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.15,
        delay,
        ease: "power3.out",
        stagger: stagger ? 0.11 : 0,
        scrollTrigger: {
          trigger: element,
          start: "top 86%",
          once: true,
        },
      },
    );

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [delay, stagger]);

  return (
    <div ref={ref} className={className} style={{ visibility: "hidden" }}>
      {children}
    </div>
  );
}
