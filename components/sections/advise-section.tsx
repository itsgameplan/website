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
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = section.getBoundingClientRect();
      const tl = adviseTimeline(window.scrollY, r.top + window.scrollY, r.height, window.innerHeight);
      section.style.setProperty("--ap", tl.pinned.toFixed(3));
      // an item shows once the strand has (mostly) become its icon, and the last one stays at the end
      const next = tl.mix > 0.45 || tl.pinned > 0.5 ? adviseIconFrame(tl.q).active : -1;
      setActive((prev) => (prev === next ? prev : next));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
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
