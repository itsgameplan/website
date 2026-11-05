import type { Dictionary } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

export function VenturesSection({ t }: { t: Dictionary; }) {
  return (
      <section id="ventures" className="gp-section gp-ventures gp-paper">
        <div className="gp-section-inner">
          <Reveal><div className="gp-eyebrow"><span className="gp-red-square"/>{t.venturesTag}</div></Reveal>
          <div className="gp-section-split">
            <Reveal><h2 className="gp-display gp-heading">{t.venturesTitle}<br/><em>{t.venturesAccent}</em></h2></Reveal>
            <Reveal delay={130}><p className="gp-section-description">{t.venturesDesc}</p></Reveal>
          </div>
          <div className="gp-venture-grid">
            {([
              { num: "01", title: t.ventureOne, desc: t.ventureOneDesc },
              { num: "02", title: t.ventureTwo, desc: t.ventureTwoDesc },
              { num: "03", title: t.ventureThree, desc: t.ventureThreeDesc },
            ]).map((item, index) => <Reveal key={item.num} delay={index * 110}><article className="gp-venture-card" tabIndex={0} data-cursor={t.view}>
              <div className="gp-venture-meta"><span>/{item.num}</span><ArrowUpRight size={21}/></div>
              <h3>{item.title}</h3><p>{item.desc}</p>
            </article></Reveal>)}
          </div>
        </div>
      </section>
  );
}
