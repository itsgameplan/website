import type { Dictionary, Chapter } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function AboutSection({ t, onNavigate }: { t: Dictionary; onNavigate: (id: Chapter) => void; }) {
  return (
      <section id="about" className="gp-about gp-section gp-paper gp-grid">
        <div className="gp-section-inner">
          <Reveal><div className="gp-eyebrow"><span className="gp-red-square"/> {t.aboutTag}</div></Reveal>
          <Reveal delay={80}><h2 className="gp-display gp-heading">{t.aboutTitle}<br/><em>{t.aboutAccent}</em></h2></Reveal>
          <div className="gp-about-lower">
            <Reveal delay={160}><div className="gp-blueprint-art" aria-hidden="true"><div className="gp-blueprint-circle"/><div className="gp-blueprint-square"/><span>{t.blueprintCaption}</span></div></Reveal>
            <Reveal delay={220}><div className="gp-about-copy"><span className="gp-mono">{t.mindset}</span><p>{t.aboutDesc}</p><button className="gp-text-link" onClick={() => onNavigate("process")}>{t.process}<ArrowUpRight size={18}/></button></div></Reveal>
          </div>
        </div>
      </section>
  );
}
