import type { Dictionary } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function AdvisorySection({ t }: { t: Dictionary; }) {
  return (
      <section id="advisory" className="gp-section gp-advisory gp-sky gp-grid">
        <div className="gp-section-inner">
          <Reveal><div className="gp-eyebrow gp-eyebrow-light"><span className="gp-white-square"/>{t.advisoryTag}</div></Reveal>
          <Reveal delay={80}><h2 className="gp-display gp-heading gp-heading-white">{t.advisoryTitle}<br/><em>{t.advisoryAccent}</em></h2></Reveal>
          <div className="gp-advisory-lower">
            <Reveal><p className="gp-advisory-description">{t.advisoryDesc}</p></Reveal>
            <div className="gp-advisory-list">{[t.advisoryOne,t.advisoryTwo,t.advisoryThree].map((item,index) =>
              <Reveal key={item} delay={index * 100}><div className="gp-advisory-row"><span>0{index + 1}</span><strong>{item}</strong><ArrowUpRight size={22}/></div></Reveal>
            )}</div>
          </div>
        </div>
      </section>
  );
}
