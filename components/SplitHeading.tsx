"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { scrollState } from "@/lib/scroll-store";

gsap.registerPlugin(ScrollTrigger, SplitText);

type Props = {
  lines: string[];
  className?: string;
  as?: "h1" | "h2" | "h3";
  /** Skip the ScrollTrigger and expose a manual play() to the parent instead. */
  manual?: boolean;
  delay?: number;
};

/**
 * Headline choreography: each line is masked, and its characters rise into
 * view on a stagger. SplitText handles the character wrapping (free in GSAP
 * 3.13) and — importantly — is reverted on unmount so the original markup and
 * its accessibility tree survive.
 */
export function SplitHeading({
  lines,
  className,
  as: Tag = "h2",
  manual = false,
  delay = 0,
}: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (scrollState.reducedMotion) {
      gsap.set(element, { autoAlpha: 1 });
      return;
    }

    let split: SplitText | null = null;
    let animation: gsap.core.Tween | null = null;

    // Fonts change glyph widths, so splitting before they land would wrap the
    // characters at the wrong positions.
    const build = () => {
      split = new SplitText(element.querySelectorAll(".split-line"), {
        type: "chars",
        charsClass: "split-char",
      });

      gsap.set(element, { autoAlpha: 1 });

      animation = gsap.from(split.chars, {
        yPercent: 118,
        duration: 1.05,
        delay,
        ease: "expo.out",
        stagger: { each: 0.016, from: "start" },
        scrollTrigger: manual
          ? undefined
          : { trigger: element, start: "top 88%", once: true },
      });
    };

    if (document.fonts?.status === "loaded") build();
    else document.fonts?.ready.then(build).catch(build);

    return () => {
      animation?.scrollTrigger?.kill();
      animation?.kill();
      split?.revert();
    };
  }, [delay, manual, lines]);

  return (
    <Tag ref={ref} className={className} style={{ visibility: "hidden" }}>
      {lines.map((line) => (
        // Each line clips its own characters, which is what makes them read as
        // rising out of the page rather than fading in place.
        <span key={line} className="split-mask">
          <span className="split-line">{line}</span>
        </span>
      ))}
    </Tag>
  );
}
