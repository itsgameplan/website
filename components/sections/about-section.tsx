import { ArrowUpRight } from "lucide-react";
import type { Dictionary, Locale } from "@/i18n/translations";
import { pagePath } from "@/lib/site-links";
import { Reveal } from "@/components/ui/reveal";

/**
 * Heritage (sport). The balls are drawn by the WebGL scene; this section is
 * tall and its copy is pinned, so the copy stays on screen for the whole ball
 * sequence (form → drift apart → scatter) instead of scrolling away early.
 */
export function AboutSection({ t, locale }: { t: Dictionary; locale: Locale }) {
  return (
      <section id="about" className="gp-about gp-heritage">
        <div className="gp-heritage-sticky">
          <div className="gp-heritage-copy">
            <Reveal delay={80}><h2 className="gp-display gp-heading">{t.aboutTitle}<br/><em>{t.aboutAccent}</em></h2></Reveal>
            <Reveal delay={160}><span className="gp-mono gp-heritage-label">{t.mindset}</span></Reveal>
            <Reveal delay={200}><p className="gp-heritage-desc">{t.aboutDesc}</p></Reveal>
            <Reveal delay={260}>
              <a className="gp-primary gp-heritage-cta" href={pagePath(locale, "verticals")}>{t.heritageCta}<ArrowUpRight size={19} /></a>
            </Reveal>
          </div>
        </div>
      </section>
  );
}
