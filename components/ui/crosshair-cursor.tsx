"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Crosshair cursor for fine pointers. The position is written straight to the element's transform
 * (once per frame at most) instead of through React state, so moving the mouse never re-renders.
 */
export function CrosshairCursor({ tapLabel = "TAP" }: { tapLabel?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hint, setHint] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia("(pointer: fine)");
    let x = -100, y = -100;
    let frame = 0;
    let lastTarget: EventTarget | null = null;
    const paint = () => {
      frame = 0;
      if (ref.current) ref.current.style.transform = `translate3d(${x}px,${y}px,0)`;
    };
    const move = (event: PointerEvent) => {
      // the system cursor is hidden site-wide on fine pointers, so the crosshair always shows there
      setEnabled(pointer.matches);
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = requestAnimationFrame(paint);
      // the hint only changes when the pointer moves onto a different element
      if (event.target !== lastTarget) {
        lastTarget = event.target;
        const target = event.target instanceof Element ? event.target.closest("a,button,[data-cursor]") : null;
        setHint(target?.getAttribute("data-cursor") || (target ? tapLabel : ""));
      }
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, [tapLabel]);

  if (!enabled) return null;
  return <div ref={ref} className={`gp-cursor ${hint ? "gp-cursor-active" : ""}`} style={{ transform: "translate3d(-100px,-100px,0)" }} aria-hidden="true">
    <span className="gp-cursor-cross">+</span>{hint && <span className="gp-cursor-label">{hint}</span>}
  </div>;
}
