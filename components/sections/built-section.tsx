"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDownRight } from "lucide-react";
import type { Chapter, Dictionary } from "@/i18n/translations";
import { Reveal } from "@/components/ui/reveal";

const BRANDS = 7;
const INDUSTRIES = 6;

/** Counts 0 → `to` once, the first time `run` turns true (instant for reduced motion). */
function useCountUp(to: number, run: boolean, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : duration;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = ms ? Math.min(1, (now - start) / ms) : 1;
      setValue(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, run, duration]);
  return value;
}

/** Straight after the hero: one clean headline, then the industries on a moving banner. */
export function BuiltSection({ t, onNavigate }: { t: Dictionary; onNavigate: (id: Chapter) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setSeen(true); observer.disconnect(); }
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const brands = useCountUp(BRANDS, seen);
  const industries = useCountUp(INDUSTRIES, seen, 1200);
  const [a, b, c] = t.builtLine;

  return (
    <section ref={ref} id="built" className="gp-built" aria-labelledby="gp-built-title">
      <div className="gp-built-inner">
        <Reveal><span className="gp-mono gp-built-label">{t.builtLabel}</span></Reveal>
        <Reveal delay={80}>
          {/* screen readers get the final numbers, not the count */}
          <h2 id="gp-built-title" className="gp-display gp-built-title" aria-label={`${a} ${BRANDS} ${b} ${INDUSTRIES} ${c}`}>
            <span aria-hidden="true">{a} <em className="gp-built-num">{brands}</em> {b} <em className="gp-built-num">{industries}</em> {c}</span>
          </h2>
        </Reveal>
      </div>

      <div className="gp-ticker gp-built-ticker" role="list" aria-label={t.builtLabel}>
        <div className="gp-ticker-track">
          {[0, 1].map((k) => (
            <span key={k} aria-hidden={k === 1 ? "true" : undefined}>
              {t.buildItems.map((item) => <b key={item} role={k === 0 ? "listitem" : undefined}>{item}<i>✳</i></b>)}
            </span>
          ))}
        </div>
      </div>

      <div className="gp-built-inner gp-built-foot">
        <button type="button" className="gp-built-cta gp-mono" onClick={() => onNavigate("ventures")}>
          {t.buildCta}<ArrowDownRight size={15} />
        </button>
      </div>
    </section>
  );
}
