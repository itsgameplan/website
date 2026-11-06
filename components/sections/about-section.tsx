import type { Dictionary, Chapter } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";

// Placeholder destination — swap in the real link to the latest achievement.
const LATEST_ACHIEVEMENT_URL = "#";

/**
 * Heritage (sport). The balls are drawn by the WebGL scene; this section is
 * tall and its copy is pinned, so the copy stays on screen for the whole ball
 * sequence (form → drift apart → scatter) instead of scrolling away early.
 */
export function AboutSection({ t }: { t: Dictionary; onNavigate: (id: Chapter) => void; }) {
  return (
      <section id="about" className="gp-about gp-heritage">
        <div className="gp-heritage-sticky">
          <div className="gp-heritage-copy">
            <Reveal><div className="gp-eyebrow"><span className="gp-red-square"/> {t.aboutTag}</div></Reveal>
            <Reveal delay={80}><h2 className="gp-display gp-heading">{t.aboutTitle}<br/><em>{t.aboutAccent}</em></h2></Reveal>
            <Reveal delay={160}><span className="gp-mono gp-heritage-label">{t.mindset}</span></Reveal>
            <Reveal delay={200}><p className="gp-heritage-desc">{t.aboutDesc}</p></Reveal>
            <Reveal delay={260}>
              <a className="gp-primary gp-heritage-cta" href={LATEST_ACHIEVEMENT_URL}>{t.aboutCta}<ArrowUpRight size={19}/></a>
            </Reveal>
          </div>
        </div>
      </section>
  );
}
