"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import type { Dictionary } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

const MOMENTUM_URL = "https://momentumhydrate.com/";

/**
 * Case study: the glass, sachets and logo are drawn by the fixed WebGL scene.
 * This section is tall so the pour can play out while its copy stays pinned.
 * The "we help develop" words reveal one after another with scroll: the section
 * writes its own progress (0 → 1 across the pinned stretch) into --mp.
 */
export function MomentumSection({ t }: { t: Dictionary }) {
  const ref = useRef<HTMLElement>(null);
  const wordsRef = useRef<HTMLUListElement>(null);
  const built = [t.mProduct, t.mPackaging, t.mTech, t.mManufacturing, t.mBrand];

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    // the section's position is measured only when the layout changes; scrolling just reads scrollY,
    // so the scroll path never forces a layout
    let top = 0, span = 1, scrollY = window.scrollY;
    let frame = 0;
    let last = "";
    const measure = () => {
      const r = section.getBoundingClientRect();
      top = r.top + window.scrollY;
      span = Math.max(1, r.height - window.innerHeight);
      scrollY = window.scrollY;
      update();
    };
    const update = () => {
      frame = 0;
      const progress = Math.min(1, Math.max(0, (scrollY - top) / span)).toFixed(3);
      // written on the word list only, so a scroll step restyles five words, not the whole section
      if (progress !== last) { last = progress; wordsRef.current?.style.setProperty("--mp", progress); }
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

  return (
    <section ref={ref} id="momentum" className="gp-momentum">
      <div className="gp-momentum-sticky">
        <div className="gp-momentum-copy">
          <Reveal delay={80}><h2 className="gp-display gp-heading">{t.momentumTitle}<br/><em>{t.momentumAccent}</em></h2></Reveal>
          <Reveal delay={160}><p className="gp-momentum-desc">{t.momentumDesc}</p></Reveal>
          <Reveal delay={220}>
            <div className="gp-momentum-built">
              <span className="gp-mono">{t.momentumBuilt}</span>
              <ul ref={wordsRef} className="gp-momentum-words">
                {built.map((word, i) => <li key={word} style={{ ["--i" as string]: i } as CSSProperties}>{word}</li>)}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={280}>
            <a className="gp-primary gp-momentum-cta" href={MOMENTUM_URL} target="_blank" rel="noopener noreferrer">
              {t.momentumCta}<ArrowUpRight size={19}/>
            </a>
          </Reveal>
        </div>
        <span className="gp-momentum-flavour gp-mono" aria-hidden="true">{t.momentumFlavour}</span>
      </div>
    </section>
  );
}
