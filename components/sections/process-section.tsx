import type { Dictionary } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

// Placeholder destinations — swap in the real links for each door.
const DOOR_LINKS = { venture: "#", advisory: "#" };

/** "Your turn": two doors — join the venture program, or work with Gameplan advisory. */
export function ProcessSection({ t }: { t: Dictionary; }) {
  const doors = [
    { n: "01", title: t.doorOneTitle, desc: t.doorOneDesc, href: DOOR_LINKS.venture, tone: "gold" },
    { n: "02", title: t.doorTwoTitle, desc: t.doorTwoDesc, href: DOOR_LINKS.advisory, tone: "glass" },
  ];
  return (
      <section id="process" className="gp-section gp-turn">
        <div className="gp-section-inner">
          <Reveal><div className="gp-turn-badge gp-mono"><span className="gp-red-square"/>{t.processTag}</div></Reveal>
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
