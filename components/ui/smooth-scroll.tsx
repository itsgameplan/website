"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let lenis: import("lenis").default | undefined;
    let frame = 0;
    let active = true;
    import("lenis").then(({ default: Lenis }) => {
      if (!active) return;
      lenis = new Lenis({ duration: 1.25, smoothWheel: true, wheelMultiplier: 0.85, touchMultiplier: 1.05 });
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
    };
  }, []);
  return null;
}
