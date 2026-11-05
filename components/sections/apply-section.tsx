import type { Dictionary } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function ApplySection({ t }: { t: Dictionary; }) {
  return (
      <section id="apply" className="gp-section gp-apply gp-grid">
        <div className="gp-section-inner gp-apply-inner">
          <Reveal><div className="gp-eyebrow gp-eyebrow-light"><span className="gp-white-square"/>{t.applyTag}</div></Reveal>
          <Reveal delay={80}><h2 className="gp-display gp-heading gp-heading-white">{t.applyTitle}<br/><em>{t.applyAccent}</em></h2></Reveal>
          <Reveal delay={160}><p>{t.applyDesc}</p></Reveal>
          <Reveal delay={210}><a className="gp-primary gp-apply-button" href={`mailto:hello@gameplan.example?subject=${encodeURIComponent(t.emailSubject)}`}>{t.applyCta}<ArrowUpRight size={21}/></a></Reveal>
          <div className="gp-apply-mark" aria-hidden="true">✳</div>
        </div>
      </section>
  );
}
