import type { Dictionary } from "@/i18n/translations";
import { Reveal } from "@/components/ui/reveal";

export function ProcessSection({ t }: { t: Dictionary; }) {
  return (
      <section id="process" className="gp-section gp-process gp-paper gp-grid">
        <div className="gp-section-inner">
          <Reveal><div className="gp-eyebrow"><span className="gp-red-square"/>{t.processTag}</div></Reveal>
          <div className="gp-section-split">
            <Reveal><h2 className="gp-display gp-heading">{t.processTitle}<br/><em>{t.processAccent}</em></h2></Reveal>
            <Reveal delay={120}><p className="gp-section-description">{t.processDesc}</p></Reveal>
          </div>
          <div className="gp-process-grid">{([
            [t.stepOne,t.stepOneDesc],[t.stepTwo,t.stepTwoDesc],[t.stepThree,t.stepThreeDesc],[t.stepFour,t.stepFourDesc]
          ]).map(([title,desc], index) => <Reveal key={title} delay={index * 85}><div className="gp-process-step" tabIndex={0}>
            <div className="gp-step-top"><span>0{index + 1} / 04</span><span className="gp-step-symbol">{["◎","◇","▧","↗"][index]}</span></div>
            <h3>{title}</h3><p>{desc}</p><div className="gp-step-line"/>
          </div></Reveal>)}</div>
        </div>
      </section>
  );
}
