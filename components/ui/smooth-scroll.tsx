"use client";

import { useEffect } from "react";
import type Lenis from "lenis";

declare global {
  interface Window { __gpLenis?: Lenis }
}

/**
 * Inertial smooth scrolling: the page glides and eases to a stop with a little
 * drag after the wheel/trackpad stops, instead of stepping. Exposed on
 * window.__gpLenis so in-page navigation can glide the same way.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // touch screens already scroll with native momentum (Lenis leaves touch alone anyway):
    // skip it there so phones don't run an extra animation loop for nothing
    if (window.matchMedia("(hover: none) and (pointer: coarse)").matches) return;
    let lenis: Lenis | undefined;
    let frame = 0;
    let active = true;
    import("lenis").then(({ default: LenisCtor }) => {
      if (!active) return;
      lenis = new LenisCtor({
        lerp: 0.075,          // lower = more glide / drag after you stop
        smoothWheel: true,
        wheelMultiplier: 0.9,
        touchMultiplier: 1.1,
      });
      window.__gpLenis = lenis;
      const raf = (time: number) => {
        lenis?.raf(time);
        frame = requestAnimationFrame(raf);
      };
      frame = requestAnimationFrame(raf);
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      lenis?.destroy();
      if (window.__gpLenis === lenis) delete window.__gpLenis;
    };
  }, []);
  return null;
}
