"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { brand, nav } from "@/lib/content";
import { scrollLock } from "@/lib/scroll-lock";
import { scrollState } from "@/lib/scroll-store";
import { GlassFilter } from "@/components/GlassFilter";

export function SiteHeader() {
  const [condensed, setCondensed] = useState(false);
  const [open, setOpen] = useState(false);
  const frame = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // The panel starts closed in CSS, so the first run has nothing to close.
  const mounted = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      // rAF-gated: scroll fires far more often than we need to flip a class.
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        setCondensed(window.scrollY > window.innerHeight * 0.6);
        frame.current = 0;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);

  // Open/close: freeze the page behind, animate the panel, manage focus.
  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;

    const items = menu.querySelectorAll<HTMLElement>("[data-menu-item]");
    const still = scrollState.reducedMotion;
    let focusFrame = 0;

    if (open) {
      if (still) {
        gsap.set(menu, { opacity: 1, visibility: "visible" });
        gsap.set(items, { opacity: 1, yPercent: 0 });
      } else {
        gsap.killTweensOf([menu, items]);
        gsap.set(menu, { opacity: 1, visibility: "visible" });
        gsap.fromTo(
          menu,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.out" },
        );
        gsap.fromTo(
          items,
          { yPercent: 45, opacity: 0 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.07,
            delay: 0.12,
          },
        );
      }
      // Focus the first link so the keyboard lands inside the panel. Deferred
      // a frame: moving focus in the same tick as the click that opened the
      // menu races the browser's own focus handling and does not always stick.
      focusFrame = requestAnimationFrame(() => {
        menu
          .querySelector<HTMLAnchorElement>("a")
          ?.focus({ preventScroll: true });
        // Locked after focusing: under reduced motion the lock sets overflow
        // on the root element, and doing that first cost the panel its focus.
        scrollLock.lock();
      });
    } else {
      scrollLock.unlock();
      if (!mounted.current) {
        mounted.current = true;
        return;
      }
      if (still) {
        gsap.set(menu, { opacity: 0, visibility: "hidden" });
      } else {
        gsap.killTweensOf([menu, items]);
        gsap.to(menu, {
          clipPath: "inset(0 0 100% 0)",
          duration: 0.5,
          ease: "expo.inOut",
          onComplete: () =>
            gsap.set(menu, { opacity: 0, visibility: "hidden" }),
        });
      }
    }

    return () => {
      if (focusFrame) cancelAnimationFrame(focusFrame);
    };
  }, [open]);

  // Escape closes, and Tab cycles within the panel rather than wandering off
  // into the page still sitting behind it.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [
        ...(menuRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []),
        toggleRef.current,
      ].filter(Boolean) as HTMLElement[];
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (!focusable.includes(active as HTMLElement)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // A stale lock would leave the page frozen if this ever unmounts while open.
  useEffect(() => () => scrollLock.unlock(), []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <GlassFilter />

      <header
        className={`site-header${condensed ? " is-condensed" : ""}${
          open ? " is-open" : ""
        }`}
      >
        {/* The glass surface, separate from the fixed positioning frame so it
            can float centred on wide screens and go full-bleed on narrow ones. */}
        <div className="site-header__bar">
          <a className="site-header__mark" href="#top" onClick={close}>
            <span>Folks</span>
            <i aria-hidden="true">&amp;</i>
            <span>Florets</span>
          </a>

          {/* <p className="site-header__note">{brand.note}</p> */}

          <nav className="site-header__nav" aria-label="Primary">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            data-cursor
          >
            <span className="menu-toggle__bars" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </header>

      <div
        id="site-menu"
        ref={menuRef}
        className="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <nav className="site-menu__nav" aria-label="Mobile">
          {nav.map((item, index) => (
            <span key={item.href} className="site-menu__row" data-menu-item>
              <a href={item.href} onClick={close}>
                <span className="site-menu__no">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="site-menu__label">{item.label}</span>
              </a>
            </span>
          ))}
        </nav>

        <div className="site-menu__foot" data-menu-item>
          <p className="site-menu__note">{brand.note}</p>
          <p className="site-menu__tagline">{brand.tagline}</p>
        </div>
      </div>
    </>
  );
}
