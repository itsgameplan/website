"use client";

import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Minus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { PageShell } from "@/components/page-shell";
import { BlockHead, BriefSection, PageHero, scrollToBrief, scrollToId } from "@/components/page-bits";
import { programs } from "@/i18n/programs";
import type { Dictionary, Locale } from "@/i18n/translations";

/**
 * Gameplan Advisory — for institutions, companies and federations. Calm, structured, blue:
 * an audience switcher that reshapes the page's pitch, a capabilities explorer, engagement
 * models you can pick, and a step-through process — all feeding the brief at the end.
 */
export function AdvisoryPage({ locale, t }: { locale: Locale; t: Dictionary }) {
  const p = programs[locale];
  const c = p.advisory;
  const [aud, setAud] = useState(0);
  const [cap, setCap] = useState(0);
  const [model, setModel] = useState<number | null>(null);
  const [step, setStep] = useState(0);
  const [preset, setPreset] = useState<Record<string, string[]>>({});
  const a = c.audiences[aud];
  const k = c.capabilities[cap];
  const s = c.process[step];
  const Prev = locale === "ar" ? ArrowRight : ArrowLeft;
  const Next = locale === "ar" ? ArrowLeft : ArrowRight;
  const MODEL_IDS = ["project", "programme", "embedded"];

  const chooseAudience = (i: number) => { setAud(i); setPreset((pr) => ({ ...pr, org: [c.audiences[i].id] })); };

  return (
    <PageShell locale={locale} t={t} page="advisory">
      <PageHero locale={locale} tag={c.tag} title={c.title} accent={c.accent} intro={c.intro} cta={c.cta} back={p.back}>
        <Reveal delay={300}>
          <div className="gp-hero-audiences">
            {c.audiences.map((x, i) => (
              <a key={x.id} href="#audiences" onClick={(e) => { e.preventDefault(); chooseAudience(i); scrollToId("audiences"); }}><span className="gp-mono">0{i + 1}</span>{x.label}</a>
            ))}
          </div>
        </Reveal>
      </PageHero>

      {/* audience switcher */}
      <section className="gp-page-block" id="audiences">
        <div className="gp-page-inner">
          <BlockHead label={c.audienceTitle} desc={c.audienceDesc} />
          <Reveal>
            <div className="gp-aud">
              <div className="gp-aud-tabs" role="tablist" aria-label={c.audienceTitle}>
                {c.audiences.map((x, i) => (
                  <button key={x.id} role="tab" aria-selected={aud === i} className={aud === i ? "is-on" : ""} onClick={() => chooseAudience(i)}>
                    <span className="gp-mono">0{i + 1}</span>
                    <strong className="gp-display">{x.label}</strong>
                    <em>{x.sub}</em>
                  </button>
                ))}
              </div>
              <div key={a.id} className="gp-aud-panel gp-swap" role="tabpanel">
                <h3 className="gp-display">{a.headline}</h3>
                <div className="gp-aud-cols">
                  <div>
                    <span className="gp-mono">{c.challengesLabel}</span>
                    <ul className="gp-aud-heard">{a.challenges.map((x) => <li key={x}><Minus size={15} />“{x}”</li>)}</ul>
                  </div>
                  <div>
                    <span className="gp-mono">{c.weRunLabel}</span>
                    <ul className="gp-checks">{a.weRun.map((x) => <li key={x}><Check size={16} />{x}</li>)}</ul>
                  </div>
                </div>
                <button type="button" className="gp-primary gp-aud-cta" onClick={() => { setPreset((pr) => ({ ...pr, org: [a.id] })); scrollToBrief(); }}>
                  {a.cta}<ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* capabilities explorer */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.capTitle} desc={c.capDesc} />
          <Reveal>
            <div className="gp-caps">
              <ol className="gp-caps-list">
                {c.capabilities.map((x, i) => (
                  <li key={x.title}>
                    <button type="button" className={cap === i ? "is-on" : ""} aria-pressed={cap === i} onClick={() => setCap(i)} onMouseEnter={() => setCap(i)}>
                      <span className="gp-mono">0{i + 1}</span>{x.title}<ArrowUpRight size={18} />
                    </button>
                  </li>
                ))}
              </ol>
              <div key={k.title} className="gp-caps-panel gp-swap">
                <span className="gp-caps-num gp-display">0{cap + 1}</span>
                <h3 className="gp-display">{k.title}</h3>
                <p>{k.desc}</p>
                <span className="gp-mono">{c.deliverablesLabel}</span>
                <ul className="gp-checks">{k.deliverables.map((x) => <li key={x}><Check size={16} />{x}</li>)}</ul>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* engagement models */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.modelTitle} desc={c.modelDesc} />
          <div className="gp-models" role="radiogroup" aria-label={c.modelTitle}>
            {c.models.map((m, i) => (
              <Reveal key={m.title} delay={i * 90}>
                <button type="button" role="radio" aria-checked={model === i} className={`gp-model ${model === i ? "is-on" : ""}`}
                  onClick={() => { setModel(i); setPreset((pr) => ({ ...pr, model: [MODEL_IDS[i]] })); }}>
                  <span className="gp-model-radio" />
                  <strong className="gp-display">{m.title}</strong>
                  <span>{m.desc}</span>
                  <em>{m.fit}</em>
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* process stepper */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.processTitle} />
          <Reveal>
            <div className="gp-stepper" style={{ "--i": step, "--n": c.process.length } as CSSProperties}>
              <div className="gp-stepper-tabs" role="tablist">
                {c.process.map((x, i) => (
                  <button key={x.title} role="tab" aria-selected={step === i} className={`${step === i ? "is-on" : ""} ${i < step ? "is-past" : ""}`} onClick={() => setStep(i)}>
                    <span className="gp-mono">{p.step} 0{i + 1}</span>{x.title}
                  </button>
                ))}
                <span className="gp-stepper-bar"><i /></span>
              </div>
              <div key={s.title} className="gp-stepper-panel gp-swap">
                <div>
                  <h3 className="gp-display">{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
                <div>
                  <span className="gp-mono">{c.youGet}</span>
                  <ul className="gp-checks">{s.get.map((x) => <li key={x}><Check size={16} />{x}</li>)}</ul>
                </div>
              </div>
              <div className="gp-stepper-nav">
                <button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} aria-label={p.prev}><Prev size={18} /></button>
                <span className="gp-mono">0{step + 1} / 0{c.process.length}</span>
                <button type="button" onClick={() => setStep(Math.min(c.process.length - 1, step + 1))} disabled={step === c.process.length - 1} aria-label={p.next}><Next size={18} /></button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* why */}
      <section className="gp-page-block">
        <div className="gp-page-inner">
          <BlockHead label={c.whyTitle} />
          <div className="gp-why">
            {c.why.map((w, i) => (
              <Reveal key={w.title} delay={i * 90}>
                <div><span className="gp-mono">0{i + 1}</span><h3 className="gp-display">{w.title}</h3><p>{w.desc}</p></div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <BriefSection locale={locale} kind="advisory" preset={preset} other="venture" otherLabel={c.otherDoor} />
    </PageShell>
  );
}
