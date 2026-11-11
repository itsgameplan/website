"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Dictionary, Locale } from "@/i18n/translations";
import { pagePath } from "@/lib/site-links";
import { ADVISE_ICON_COUNT, adviseIconFrame, adviseTimeline } from "@/lib/advise-timeline";

/**
 * "What we offer — we advise." A tall section whose copy stays pinned while the DNA strand
 * (drawn by the WebGL scene) becomes one icon per service. Each item appears as its icon forms;
 * both sides read the same timeline (lib/advise-timeline.ts).
 */
export function AdviseSection({ t, locale }: { t: Dictionary; locale: Locale }) {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    // the progress bar is the only thing that reads --ap: writing it there (not on the section)
    // keeps each scroll step from restyling the whole pinned chapter
    const bar = section.querySelector<HTMLElement>(".gp-advise-bar span");
    // layout is measured only when it changes; scrolling just reads scrollY (no forced layout per frame)
    let top = 0, height = 1, viewH = window.innerHeight, scrollY = window.scrollY;
    let frame = 0;
    let lastAp = "";
    const update = () => {
      frame = 0;
      const tl = adviseTimeline(scrollY, top, height, viewH);
      const ap = tl.pinned.toFixed(3);
      if (ap !== lastAp) { lastAp = ap; bar?.style.setProperty("--ap", ap); }
      // an item shows once the strand has (mostly) become its icon, and the last one stays at the end
      const next = tl.mix > 0.45 || tl.pinned > 0.5 ? adviseIconFrame(tl.q).active : -1;
      setActive((prev) => (prev === next ? prev : next));
    };
    const measure = () => {
      const r = section.getBoundingClientRect();
      top = r.top + window.scrollY;
      height = r.height;
      viewH = window.innerHeight;
      scrollY = window.scrollY;
      update();
    };
    const onScroll = () => { scrollY = window.scrollY; if (!frame) frame = requestAnimationFrame(update); };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(document.body);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
    };
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    <section ref={ref} id="advise" className="gp-advise" aria-labelledby="gp-advise-title">
      <div className="gp-advise-sticky">
        <div className="gp-advise-copy">
          <span className="gp-mono gp-advise-label">{t.offerLabel}</span>
          <h2 id="gp-advise-title" className="gp-display gp-heading gp-advise-title">{t.offerTitle} <em>{t.offerAccent}</em></h2>
          <p className="gp-advise-lead">{t.adviseLead}</p>
          <ol className="gp-advise-list">
            {t.adviseItems.map((item, i) => (
              <li key={item} className={`${i === active ? "is-on" : ""} ${i < active ? "is-past" : ""} ${i <= active ? "is-shown" : ""}`}
                aria-current={i === active ? "step" : undefined} style={{ ["--i" as string]: i } as CSSProperties}>
                <span className="gp-mono">{pad(i + 1)}</span>{item}
              </li>
            ))}
          </ol>
          <div className="gp-advise-foot">
            <span className="gp-mono gp-advise-count" aria-hidden="true">{pad(Math.max(1, active + 1))} / {pad(ADVISE_ICON_COUNT)}</span>
            <span className="gp-advise-bar" aria-hidden="true"><span /></span>
            <a className="gp-primary gp-advise-cta" href={pagePath(locale, "advisory")}>{t.adviseCta}<ArrowUpRight size={18} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
