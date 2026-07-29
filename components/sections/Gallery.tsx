"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { collections } from "@/lib/content";
import { scrollState } from "@/lib/scroll-store";
import { SplitHeading } from "@/components/SplitHeading";

gsap.registerPlugin(ScrollTrigger);

/**
 * The change of axis. The page locks and the collections travel sideways,
 * which breaks up a long vertical scroll more effectively than any amount of
 * vertical variation. Scroll velocity skews the cards as they pass.
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

    const cards = Array.from(track.querySelectorAll<HTMLElement>(".slide"));
    const setSkew = cards.map(
      (card) => gsap.quickSetter(card, "skewY", "deg") as (v: number) => void,
    );

    const context = gsap.context(() => {
      // Distance is measured in a callback so a resize recomputes it rather
      // than baking in the width from first paint.
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);

      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: root,
          start: "top top",
          // Scroll length matches the horizontal travel, so the sideways
          // movement runs at roughly the same speed as the vertical scroll.
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
      const v = scrollState.reducedMotion ? 0 : scrollState.velocity * 2.2;
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
              lines={collections.title}
              className="display display--md"
            />
            <p className="lede">{collections.body}</p>
            <p className="gallery__hint">
              <b aria-hidden="true">→</b>
              <span>Keep scrolling</span>
            </p>
          </div>

          {collections.items.map((item, index) => (
            <article key={item.no} className="slide slide--card" data-cursor>
              <div className="slide__frame">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 900px) 84vw, 38vw"
                  style={{ objectFit: "cover", objectPosition: item.focus }}
                  priority={index === 0}
                />
                <span className="slide__no">{item.no}</span>
              </div>
              <div className="slide__body">
                <p className="slide__latin">{item.latin}</p>
                <h3 className="slide__name">{item.name}</h3>
                <p className="slide__text">{item.body}</p>
                <p className="slide__meta">
                  <span>{item.meta}</span>
                  <b aria-hidden="true">↗</b>
                </p>
              </div>
            </article>
          ))}

          <div className="slide slide--outro">
            <p className="eyebrow">Bespoke</p>
            <p className="slide__outro-copy">
              Or let us compose something that exists only once.
            </p>
            <a className="button button--solid" href="#invitation">
              <span>Start a commission</span>
              <b aria-hidden="true">↗</b>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
