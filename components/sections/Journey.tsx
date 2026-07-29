"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { chapters, CHAPTER_SPAN } from "@/lib/journey";
import { scrollState, syncChapterParam } from "@/lib/scroll-store";
import { SplitHeading } from "@/components/SplitHeading";
import { Magnetic } from "@/components/Magnetic";

gsap.registerPlugin(ScrollTrigger);

/**
 * How far either side of its station a chapter stays legible, in chapter
 * units. Just above 0.5 so neighbours hand off cleanly rather than leaving two
 * headlines readable at once through the middle of every transition.
 */
const CHAPTER_REACH = 0.54;

/** Each chapter gets this many viewport heights of scroll to itself. */
const DWELL = 1.35;

export function Journey() {
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

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
    }));
    const setRail = railRef.current
      ? (gsap.quickSetter(railRef.current, "scaleY") as (v: number) => void)
      : null;

    let shownIndex = -1;

    const paint = (progress: number) => {
      const u = progress * CHAPTER_SPAN;

      setters.forEach(({ panel, opacity, y }, index) => {
        const offset = u - index;
        const distance = Math.abs(offset);
        const t = Math.max(0, 1 - distance / CHAPTER_REACH);
        const alpha = t * t * (3 - 2 * t);

        opacity(alpha);
        y(offset * -64);
        panel.style.pointerEvents = alpha > 0.65 ? "auto" : "none";
        panel.setAttribute("aria-hidden", alpha > 0.2 ? "false" : "true");
      });

      setRail?.(progress);

      const nearest = Math.round(u);
      if (nearest !== shownIndex && countRef.current) {
        shownIndex = nearest;
        countRef.current.textContent = chapters[nearest]?.index ?? "";
      }
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
        syncChapterParam();
        paint(self.progress);
      },
      onRefresh: (self) => paint(self.progress),
    });

    // The journey trigger stops updating once its range is behind us, which
    // would leave the last chapter pinned over the content below. The epilogue
    // keeps moving after that, so read it on the ticker and fade against it.
    const setViewportOpacity = gsap.quickSetter(viewport, "opacity") as (
      v: number,
    ) => void;
    let lastEpilogue = -1;

    const fadeOut = () => {
      const epilogue = scrollState.epilogue;
      if (epilogue === lastEpilogue) return;
      lastEpilogue = epilogue;
      const t = Math.min(1, epilogue / 0.5);
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
      style={{ height: `${chapters.length * DWELL * 100}vh` }}
    >
      <div ref={viewportRef} className="journey__viewport">
        {chapters.map((chapter, index) => (
          <article
            key={chapter.index}
            data-chapter={index}
            className={`chapter chapter--${chapter.tone}${
              index === 0 ? " chapter--opening" : ""
            }`}
          >
            <p className="chapter__eyebrow">
              <span className="chapter__numeral">{chapter.index}</span>
              {chapter.eyebrow}
            </p>

            <SplitHeading
              as={index === 0 ? "h1" : "h2"}
              lines={chapter.title}
              className="chapter__title"
            />

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
          <span ref={countRef} className="journey__count">
            I
          </span>
          <span className="journey__rail-track">
            <span ref={railRef} className="journey__rail-fill" />
          </span>
          <span className="journey__total">{chapters.length}</span>
        </div>
      </div>
    </div>
  );
}
