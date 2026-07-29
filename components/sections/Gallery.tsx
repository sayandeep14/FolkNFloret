"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { collections } from "@/lib/content";
import { scrollState } from "@/lib/scroll-store";
import { SplitHeading } from "@/components/SplitHeading";
import { Magnetic } from "@/components/Magnetic";

gsap.registerPlugin(ScrollTrigger);

/**
 * The change of axis. Halfway down the page the scroll turns sideways, which
 * breaks a long vertical read far more effectively than any amount of vertical
 * variation. Built entirely from type and rules — no imagery — so it stays in
 * the same restrained register as the rest of the page.
 */
export function Gallery() {
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!root || !viewport || !track) return;

    const slides = Array.from(track.querySelectorAll<HTMLElement>(".slide"));
    const setSkew = slides.map(
      (slide) => gsap.quickSetter(slide, "skewY", "deg") as (v: number) => void,
    );

    const context = gsap.context(() => {
      // Measured in a callback so a resize recomputes it rather than baking in
      // the width from first paint.
      const distance = () =>
        Math.max(0, track.scrollWidth - viewport.clientWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          // Scroll length matches horizontal travel, so sideways movement runs
          // at roughly the same speed as the vertical scroll it replaces.
          end: () => `+=${distance()}`,
          pin: viewport,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
    }, root);

    let last = 0;
    const skew = () => {
      const v = scrollState.reducedMotion ? 0 : scrollState.velocity * 2;
      if (Math.abs(v - last) < 0.01) return;
      last = v;
      setSkew.forEach((set) => set(v));
    };
    gsap.ticker.add(skew);

    return () => {
      gsap.ticker.remove(skew);
      context.revert();
    };
  }, []);

  return (
    <section id="collections" ref={rootRef} className="gallery">
      <div ref={viewportRef} className="gallery__viewport">
        <div ref={trackRef} className="gallery__track">
          <div className="slide slide--intro">
            <p className="eyebrow">{collections.eyebrow}</p>
            <SplitHeading
              lines={collections.titleLines}
              className="display display--md"
            />
            <p className="lede">{collections.body}</p>
            <p className="gallery__hint">
              <b aria-hidden="true">→</b>
              <span>Keep scrolling</span>
            </p>
          </div>

          {collections.items.map((item) => (
            <article key={item.no} className="slide slide--card" data-cursor>
              <span className="slide__no">{item.no}</span>
              <p className="slide__latin">{item.latin}</p>
              <h3 className="slide__name">{item.name}</h3>
              <p className="slide__text">{item.body}</p>
              <p className="slide__meta">
                <span>{item.meta}</span>
                <b aria-hidden="true">↗</b>
              </p>
            </article>
          ))}

          <div className="slide slide--outro">
            <p className="eyebrow">Bespoke</p>
            <p className="slide__outro-copy">
              Or let us compose something that exists only once.
            </p>
            <Magnetic>
              <a className="button button--solid" href="#invitation">
                <span>Start a commission</span>
                <b aria-hidden="true">↗</b>
              </a>
            </Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}
