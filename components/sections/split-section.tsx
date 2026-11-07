"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Chapter, Dictionary, Locale } from "@/i18n/translations";
import { pagePath } from "@/lib/site-links";
import { Reveal } from "@/components/ui/reveal";

const BRANDS = 7;
const INDUSTRIES = 6;

/** Counts 0 → `to` once, the first time `run` turns true (skipped for reduced motion). */
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

/**
 * "We advise. We build." — straight after the hero: two doors. Advisory opens the
 * advisory page; Build glides into the brand sequence (Cairo Tech → ASL → Momentum).
 */
export function SplitSection({ t, locale, onNavigate }: { t: Dictionary; locale: Locale; onNavigate: (id: Chapter) => void }) {
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
  const [lead1, lead2, lead3] = t.buildLead;

  return (
    <section ref={ref} id="split" className="gp-section gp-turn gp-split">
      <div className="gp-section-inner">
        <Reveal delay={60}><h2 className="gp-display gp-split-title">{t.splitTitle} <em>{t.splitAccent}</em></h2></Reveal>
        <Reveal delay={120}><p className="gp-turn-sub">{t.splitDesc}</p></Reveal>
        <div className="gp-doors gp-split-doors">
          <Reveal delay={180}>
            <a className="gp-door gp-door-glass" href={pagePath(locale, "advisory")} data-cursor={t.doorEnter}>
              <span className="gp-door-frame" aria-hidden="true" />
              <span className="gp-door-leaf">
                <span className="gp-door-label gp-mono">{t.doorLabel} 01</span>
                <span className="gp-door-title gp-display">{t.adviseTitle}</span>
                <span className="gp-split-lead">{t.adviseLead}</span>
                <ul className="gp-split-list gp-split-list-2">
                  {t.adviseItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <span className="gp-door-enter gp-mono">{t.adviseCta}<ArrowUpRight size={15} /></span>
                <span className="gp-door-knob" aria-hidden="true" />
              </span>
            </a>
          </Reveal>
          <Reveal delay={300}>
            <a className="gp-door gp-door-gold" href="#ventures" data-cursor={t.doorEnter}
              onClick={(e) => { e.preventDefault(); onNavigate("ventures"); }}>
              <span className="gp-door-frame" aria-hidden="true" />
              <span className="gp-door-leaf">
                <span className="gp-door-label gp-mono">{t.doorLabel} 02</span>
                <span className="gp-door-title gp-display">{t.buildTitle}</span>
                <span className="gp-split-lead">
                  {lead1} <strong className="gp-split-count">{brands}</strong> {lead2} <strong className="gp-split-count">{industries}</strong> {lead3}
                </span>
                <ul className="gp-split-list gp-split-list-2">
                  {t.buildItems.map((item) => <li key={item}>{item}</li>)}
                </ul>
                <span className="gp-door-enter gp-mono">{t.buildCta}<ArrowDownRight size={15} /></span>
                <span className="gp-door-knob" aria-hidden="true" />
              </span>
            </a>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
