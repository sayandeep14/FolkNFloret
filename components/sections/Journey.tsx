"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters } from "@/lib/content";
import { JOURNEY_SPAN, scrollState, syncCameraParam } from "@/lib/scroll-store";
import { CHAPTER_ENTER, SplitHeading } from "@/components/SplitHeading";
import { Magnetic } from "@/components/Magnetic";

gsap.registerPlugin(ScrollTrigger);

/**
 * How far either side of its station a chapter stays legible, in keyframe
 * units. Just above 0.5 so neighbours hand off cleanly — at 0.62 two headlines
 * were readable at once through the middle of every transition.
 */
const CHAPTER_REACH = 0.54;

export function Journey() {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    if (!root || !viewport) return;

    const panels = Array.from(
      viewport.querySelectorAll<HTMLElement>("[data-chapter]"),
    );

    // quickSetter avoids GSAP's per-call overhead — this runs every frame.
    const setters = panels.map((panel) => ({
      panel,
      opacity: gsap.quickSetter(panel, "opacity") as (v: number) => void,
      y: gsap.quickSetter(panel, "y", "px") as (v: number) => void,
      scale: gsap.quickSetter(panel, "scale") as (v: number) => void,
    }));
    const setRail = railRef.current
      ? (gsap.quickSetter(railRef.current, "scaleY") as (v: number) => void)
      : null;

    let active = -1;

    const paint = (progress: number) => {
      const u = progress * JOURNEY_SPAN;

      // Whichever station we are nearest owns the screen. Replaying the
      // headline on entry is what makes the choreography worth having.
      const nearest = Math.round(u);
      if (nearest !== active) {
        panels[active]?.removeAttribute("data-active");
        active = nearest;
        const panel = panels[active];
        if (panel) {
          panel.dataset.active = "true";
          panel.dispatchEvent(new CustomEvent(CHAPTER_ENTER));
        }
      }

      setters.forEach(({ panel, opacity, y, scale }, index) => {
        const offset = u - index;
        const distance = Math.abs(offset);
        // Ease the falloff so chapters bleed into each other rather than blink.
        const t = Math.max(0, 1 - distance / CHAPTER_REACH);
        const alpha = t * t * (3 - 2 * t);

        opacity(alpha);
        y(offset * -70);
        scale(1 - distance * 0.04);
        panel.style.pointerEvents = alpha > 0.65 ? "auto" : "none";
        panel.setAttribute("aria-hidden", alpha > 0.2 ? "false" : "true");
      });

      setRail?.(progress);
    };

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      pin: viewport,
      pinSpacing: false,
      scrub: true,
      onUpdate: (self) => {
        scrollState.journey = self.progress;
        syncCameraParam();
        paint(self.progress);
      },
      onRefresh: (self) => paint(self.progress),
    });

    // The journey trigger stops updating once its scroll range is behind us,
    // which would leave the last chapter pinned at full opacity over the
    // content below. The epilogue value keeps moving after that, so read it on
    // the ticker and fade the whole viewport out against it.
    const setViewportOpacity = gsap.quickSetter(viewport, "opacity") as (
      v: number,
    ) => void;
    let lastEpilogue = -1;

    const fadeOut = () => {
      const epilogue = scrollState.epilogue;
      if (epilogue === lastEpilogue) return;
      lastEpilogue = epilogue;
      const t = Math.min(1, epilogue / 0.55);
      setViewportOpacity(1 - t * t * (3 - 2 * t));
      viewport.style.pointerEvents = epilogue > 0.05 ? "none" : "auto";
    };

    gsap.ticker.add(fadeOut);
    paint(0);

    return () => {
      gsap.ticker.remove(fadeOut);
      trigger.kill();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="journey"
      style={{ height: `${chapters.length * 100}vh` }}
    >
      <div ref={viewportRef} className="journey__viewport">
        {chapters.map((chapter, index) => (
          <article
            key={chapter.index}
            data-chapter={index}
            // One room, one polarity: the backdrop never leaves ink, so every
            // chapter uses the same cream type and the same scrim.
            className={`chapter${index === 0 ? " chapter--brand" : ""}`}
          >
            <p className="chapter__eyebrow">
              <span className="chapter__numeral">{chapter.index}</span>
              {chapter.eyebrow}
            </p>

            {index === 0 ? (
              <h1 className="chapter__title chapter__title--brand">
                <span className="brand-line">
                  <span>{chapter.title[0]}</span>
                  <i aria-hidden="true">&amp;</i>
                </span>
                <span className="brand-line">{chapter.title[1]}</span>
              </h1>
            ) : (
              <SplitHeading
                lines={chapter.title}
                className="chapter__title"
                chapterScoped
              />
            )}

            <p className="chapter__body">{chapter.body}</p>

            {chapter.cta ? (
              <Magnetic className="chapter__cta">
                <a className="button button--ghost" href={chapter.cta.href}>
                  <span>{chapter.cta.label}</span>
                  <b aria-hidden="true">↓</b>
                </a>
              </Magnetic>
            ) : null}

            {chapter.cue ? (
              <p className="chapter__cue">
                <span>{chapter.cue}</span>
                <b aria-hidden="true" />
              </p>
            ) : null}
          </article>
        ))}

        <div className="journey__rail" aria-hidden="true">
          <span ref={railRef} className="journey__rail-fill" />
        </div>
      </div>
    </div>
  );
}
