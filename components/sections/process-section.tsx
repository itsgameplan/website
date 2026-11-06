import type { Dictionary, Locale } from "@/i18n/translations";
import { pagePath } from "@/lib/site-links";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

/** "Your turn": two doors — join the venture program, or work with Gameplan advisory. */
export function ProcessSection({ t, locale }: { t: Dictionary; locale: Locale }) {
  const doors = [
    { n: "01", title: t.doorOneTitle, desc: t.doorOneDesc, href: pagePath(locale, "venture"), tone: "gold" },
    { n: "02", title: t.doorTwoTitle, desc: t.doorTwoDesc, href: pagePath(locale, "advisory"), tone: "glass" },
  ];
  return (
      <section id="process" className="gp-section gp-turn">
        <div className="gp-section-inner">
          <Reveal delay={80}><h2 className="gp-display gp-turn-title">{t.processTitle}</h2></Reveal>
          <Reveal delay={140}><p className="gp-turn-sub">{t.processDesc}</p></Reveal>
          <div className="gp-doors">
            {doors.map((d, i) => (
              <Reveal key={d.n} delay={200 + i * 120}>
                <a className={`gp-door gp-door-${d.tone}`} href={d.href} data-cursor={t.doorEnter}>
                  <span className="gp-door-frame" aria-hidden="true" />
                  <span className="gp-door-leaf">
                    <span className="gp-door-label gp-mono">{t.doorLabel} {d.n}</span>
                    <span className="gp-door-title gp-display">{d.title}</span>
                    <span className="gp-door-desc">{d.desc}</span>
                    <span className="gp-door-enter gp-mono">{t.doorEnter}<ArrowUpRight size={15}/></span>
                    <span className="gp-door-knob" aria-hidden="true" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
  );
}
