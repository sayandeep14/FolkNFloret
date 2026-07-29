"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scrollState, syncCameraParam } from "@/lib/scroll-store";

gsap.registerPlugin(ScrollTrigger);

/**
 * Carries the camera from its final journey station to the epilogue station as
 * the content sections arrive, so the hand-off out of the pin is continuous
 * rather than a cut.
 */
export function EpilogueTracker() {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const trigger = ScrollTrigger.create({
      trigger: marker,
      start: "top bottom",
      end: "top top",
      scrub: true,
      onUpdate: (self) => {
        scrollState.epilogue = self.progress;
        syncCameraParam();
      },
    });

    return () => trigger.kill();
  }, []);

  return <div ref={markerRef} className="epilogue-marker" aria-hidden="true" />;
}
