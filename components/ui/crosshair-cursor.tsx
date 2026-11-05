"use client";

import { useEffect, useState } from "react";

export function CrosshairCursor({ tapLabel = "TAP" }: { tapLabel?: string }) {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hint, setHint] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const pointer = window.matchMedia("(pointer: fine)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const move = (event: PointerEvent) => {
      setEnabled(pointer.matches && !motion.matches);
      setPos({ x: event.clientX, y: event.clientY });
      const target = event.target instanceof Element ? event.target.closest("a,button,[data-cursor]") : null;
      setHint(target?.getAttribute("data-cursor") || (target ? tapLabel : ""));
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [tapLabel]);

  if (!enabled) return null;
  return <div className={`gp-cursor ${hint ? "gp-cursor-active" : ""}`} style={{ transform: `translate3d(${pos.x}px,${pos.y}px,0)` }} aria-hidden="true">
    <span className="gp-cursor-cross">+</span>{hint && <span className="gp-cursor-label">{hint}</span>}
  </div>;
}
