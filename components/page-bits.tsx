"use client";

import { useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight, Plus } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { BriefForm } from "@/components/brief-form";
import { briefForms, type BriefKind } from "@/i18n/brief-forms";
import type { Locale } from "@/i18n/translations";
import { pagePath, type SitePage } from "@/lib/site-links";

/** Glide to a section of the page (with the smooth-scroll engine when it is running). */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (window.__gpLenis) window.__gpLenis.scrollTo(el, { duration: 1.6, offset: -40 });
  else el.scrollIntoView({ behavior: "smooth" });
}
/** Glide to the brief form at the end of the page. */
export const scrollToBrief = () => scrollToId("brief");

/** Opening section shared by the program pages. */
export function PageHero({ locale, tag, title, accent, intro, cta, back, children }: {
  locale: Locale; tag: string; title: string; accent: string; intro: string; cta: string; back: string; children?: ReactNode;
}) {
  return (
    <section className="gp-page-hero">
      <div className="gp-page-inner">
        <Reveal><span className="gp-page-tag gp-mono">{tag}</span></Reveal>
        <Reveal delay={80}><h1 className="gp-display gp-page-title">{title}<br /><em>{accent}</em></h1></Reveal>
        <Reveal delay={160}><p className="gp-page-intro">{intro}</p></Reveal>
        <Reveal delay={220}>
          <div className="gp-page-actions">
            <a className="gp-primary" href="#brief" onClick={(e) => { e.preventDefault(); scrollToBrief(); }}>{cta}<ArrowUpRight size={19} /></a>
            <a className="gp-page-back gp-mono" href={`/${locale}`}>{back}</a>
          </div>
        </Reveal>
        {children}
      </div>
    </section>
  );
}

/** Section heading: small mono label, optional one-line description. */
export function BlockHead({ label, desc, aside }: { label: string; desc?: string; aside?: ReactNode }) {
  return (
    <Reveal>
      <div className="gp-block-head">
        <div>
          <h2 className="gp-page-label gp-mono">{label}</h2>
          {desc && <p>{desc}</p>}
        </div>
        {aside}
      </div>
    </Reveal>
  );
}

/** Questions that open one at a time. */
export function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="gp-accordion">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={it.q} className={`gp-accordion-item ${on ? "is-open" : ""}`}>
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
              <span>{it.q}</span><Plus size={20} />
            </button>
            <div className="gp-accordion-panel" role="region"><div><p>{it.a}</p></div></div>
          </div>
        );
      })}
    </div>
  );
}

/** The closing brief form, with a link across to the other door. */
export function BriefSection({ locale, kind, preset, other, otherLabel }: {
  locale: Locale; kind: BriefKind; preset?: Record<string, string[]>; other: SitePage; otherLabel: string;
}) {
  const brief = briefForms[locale][kind];
  const Forward = locale === "ar" ? ArrowLeft : ArrowRight;
  return (
    <section className="gp-page-close" id="brief">
      <div className="gp-page-inner">
        <Reveal><h2 className="gp-display gp-page-title">{brief.title}<br /><em>{brief.accent}</em></h2></Reveal>
        <Reveal delay={100}><p className="gp-page-intro">{brief.intro}</p></Reveal>
        <Reveal delay={160}><BriefForm locale={locale} kind={kind} preset={preset} /></Reveal>
        <Reveal delay={200}>
          <div className="gp-page-actions">
            <a className="gp-page-other gp-mono" href={pagePath(locale, other)}>{otherLabel}<Forward size={15} /></a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
