import type { Dictionary } from "@/i18n/translations";
import { Reveal } from "@/components/ui/reveal";

/**
 * Case study: the glass, sachets and logo are drawn by the fixed WebGL scene.
 * This section is tall so the pour can play out while its copy stays pinned.
 */
export function MomentumSection({ t }: { t: Dictionary }) {
  return (
    <section id="momentum" className="gp-momentum">
      <div className="gp-momentum-sticky">
        <div className="gp-momentum-copy">
          <Reveal><div className="gp-eyebrow"><span className="gp-red-square"/>{t.momentumTag}</div></Reveal>
          <Reveal delay={80}><h2 className="gp-display gp-heading">{t.momentumTitle}<br/><em>{t.momentumAccent}</em></h2></Reveal>
          <Reveal delay={160}><p className="gp-momentum-desc">{t.momentumDesc}</p></Reveal>
          <Reveal delay={220}><p className="gp-momentum-services gp-mono">{t.momentumServices}</p></Reveal>
        </div>
        <span className="gp-momentum-flavour gp-mono" aria-hidden="true">{t.momentumFlavour}</span>
      </div>
    </section>
  );
}
