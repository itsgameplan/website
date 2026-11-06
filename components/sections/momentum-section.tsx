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
  const built = [t.mProduct, t.mPackaging, t.mTech, t.mManufacturing, t.mBrand];

  useEffect(() => {
    const section = ref.current;
    if (!section) return;
    let frame = 0;
    let last = "";
    const update = () => {
      frame = 0;
      const r = section.getBoundingClientRect();
      const span = Math.max(1, r.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -r.top / span)).toFixed(3);
      if (progress !== last) { last = progress; section.style.setProperty("--mp", progress); }
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

  return (
    <section ref={ref} id="momentum" className="gp-momentum">
      <div className="gp-momentum-sticky">
        <div className="gp-momentum-copy">
          <Reveal><div className="gp-eyebrow"><span className="gp-red-square"/>{t.momentumTag}</div></Reveal>
          <Reveal delay={80}><h2 className="gp-display gp-heading">{t.momentumTitle}<br/><em>{t.momentumAccent}</em></h2></Reveal>
          <Reveal delay={160}><p className="gp-momentum-desc">{t.momentumDesc}</p></Reveal>
          <Reveal delay={220}>
            <div className="gp-momentum-built">
              <span className="gp-mono">{t.momentumBuilt}</span>
              <ul className="gp-momentum-words">
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
