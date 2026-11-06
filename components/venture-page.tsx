"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { PageShell } from "@/components/page-shell";
import { Accordion, BlockHead, BriefSection, PageHero, scrollToBrief } from "@/components/page-bits";
import { programs } from "@/i18n/programs";
import type { Dictionary, Locale } from "@/i18n/translations";

/** 0 → 1 as the element scrolls through the middle of the screen. */
function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const v = (window.innerHeight * 0.62 - r.top) / Math.max(1, r.height);
      setP(Math.min(1, Math.max(0, v)));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", on); window.removeEventListener("resize", on); };
  }, []);
  return [ref, p] as const;
}

/**
 * Venture Program — for founders. Gold, energetic, hands-on: a ticker of what we bring, a deal
 * builder (cash / services / both), a stage finder that pre-fills the application, flip cards,
 * a scroll-lit journey, the portfolio and founder FAQs, ending in the application form.
 */
export function VenturePage({ locale, t }: { locale: Locale; t: Dictionary }) {
  const p = programs[locale];
  const c = p.venture;
  const [deal, setDeal] = useState(2);
  const [stage, setStage] = useState(0);
  const [flipped, setFlipped] = useState<number | null>(null);
  const [preset, setPreset] = useState<Record<string, string[]>>({});
  const [journeyRef, progress] = useScrollProgress<HTMLOListElement>();
  const d = c.deal[deal];
  const st = c.stages[stage];

  return (
    <PageShell locale={locale} t={t} page="venture">
      <PageHero locale={locale} tag={c.tag} title={c.title} accent={c.accent} intro={c.intro} cta={c.cta} back={p.back} />

      {/* what we bring, on a loop */}
      <div className="gp-ticker" aria-hidden="true">
        <div className="gp-ticker-track">
          {[0, 1].map((k) => <span key={k}>{c.ticker.map((w) => <b key={w}>{w}<i>✳</i></b>)}</span>)}
        </div>
      </div>

      {/* deal builder */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.dealTitle} desc={c.dealDesc} />
          <Reveal>
            <div className="gp-deal">
              <div className={`gp-deal-viz is-${d.id}`} aria-hidden="true">
                <span className="gp-deal-orb gp-deal-cash">{c.deal[0].label}</span>
                <span className="gp-deal-orb gp-deal-services">{c.deal[1].label}</span>
                <span className="gp-deal-equity gp-mono">{c.dealEquity}</span>
              </div>
              <div className="gp-deal-panel">
                <div className="gp-seg" role="tablist" aria-label={c.dealTitle}>
                  {c.deal.map((o, i) => (
                    <button key={o.id} role="tab" aria-selected={deal === i} className={deal === i ? "is-on" : ""} onClick={() => setDeal(i)}>{o.label}</button>
                  ))}
                  <span className="gp-seg-thumb" style={{ "--i": deal, "--n": c.deal.length } as CSSProperties} />
                </div>
                <div key={d.id} className="gp-swap">
                  <h3 className="gp-display">{d.headline}</h3>
                  <ul className="gp-checks">{d.points.map((pt) => <li key={pt}><Check size={16} />{pt}</li>)}</ul>
                </div>
                <p className="gp-deal-note gp-mono">{c.dealNote}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* stage finder */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.stageTitle} desc={c.stageDesc} />
          <Reveal>
            <div className="gp-stages">
              <div className="gp-stage-rail" role="tablist" style={{ "--i": stage, "--n": c.stages.length } as CSSProperties}>
                <span className="gp-stage-fill" />
                {c.stages.map((s, i) => (
                  <button key={s.id} role="tab" aria-selected={stage === i} className={`${stage === i ? "is-on" : ""} ${i < stage ? "is-past" : ""}`} onClick={() => setStage(i)}>
                    <span className="gp-stage-dot" /><span className="gp-mono">0{i + 1}</span>{s.label}
                  </button>
                ))}
              </div>
              <div key={st.id} className="gp-stage-panel gp-swap">
                <h3 className="gp-display">{st.headline}</h3>
                <p>{st.desc}</p>
                <div className="gp-tags">{st.focus.map((f) => <span key={f}>{f}</span>)}</div>
                <button type="button" className="gp-page-other gp-mono" onClick={() => { /* stage ids match the form */ setPreset({ stage: [st.id] }); scrollToBrief(); }}>
                  {c.cta} · {st.label}<ArrowUpRight size={15} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* flip cards */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.offerTitle} aside={<span className="gp-block-hint gp-mono">{c.offerHint}</span>} />
          <div className="gp-flips">
            {c.offer.map((o, i) => (
              <Reveal key={o.title} delay={i * 80}>
                <button type="button" className={`gp-flip ${flipped === i ? "is-flipped" : ""}`} aria-pressed={flipped === i} onClick={() => setFlipped(flipped === i ? null : i)}>
                  <span className="gp-flip-inner">
                    <span className="gp-flip-face">
                      <span className="gp-mono">0{i + 1}</span>
                      <strong className="gp-display">{o.title}</strong>
                      <span className="gp-flip-desc">{o.desc}</span>
                      <span className="gp-flip-plus">+</span>
                    </span>
                    <span className="gp-flip-face gp-flip-back">
                      <strong className="gp-display">{o.title}</strong>
                      <span className="gp-checks">{o.more.map((m) => <span key={m}><Check size={15} />{m}</span>)}</span>
                    </span>
                  </span>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* journey, lit as you scroll */}
      <section className="gp-page-block">
        <div className="gp-page-inner gp-page-split">
          <BlockHead label={c.journeyTitle} />
          <ol ref={journeyRef} className="gp-journey" style={{ "--p": progress } as CSSProperties}>
            <span className="gp-journey-line" aria-hidden="true" />
            {c.journey.map((s, i) => (
              <li key={s.title} className={progress >= (i + 0.35) / c.journey.length ? "is-lit" : ""}>
                <span className="gp-mono">{p.step} 0{i + 1}</span>
                <h3 className="gp-display">{s.title}</h3>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* portfolio */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.proofTitle} />
          <div className="gp-page-proof">
            {c.proof.map((w, i) => (
              <Reveal key={w.name} delay={i * 80}>
                <a href={`/${locale}#${w.chapter}`} data-cursor={t.view}>
                  <strong className="gp-display">{w.name}</strong>
                  <span>{w.desc}{w.tags && <span className="gp-tags">{w.tags.map((tg) => <span key={tg}>{tg}</span>)}</span>}</span>
                  <ArrowUpRight size={18} />
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="gp-page-block">
        <div className="gp-page-inner gp-page-split">
          <BlockHead label={c.faqTitle} />
          <Reveal><Accordion items={c.faq} /></Reveal>
        </div>
      </section>

      <BriefSection locale={locale} kind="venture" preset={preset} other="advisory" otherLabel={c.otherDoor} />
    </PageShell>
  );
}
