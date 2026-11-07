/* eslint-disable @next/next/no-img-element */
import type { Dictionary } from "@/i18n/translations";
import { Reveal } from "@/components/ui/reveal";

/**
 * Follows the heritage chapter: the three pillars Gameplan works on (with the team
 * photo), then the athlete sponsorship block (Omar Assar).
 */
export function VerticalsSection({ t }: { t: Dictionary }) {
  return (
    <section id="verticals" className="gp-verticals">
      <div className="gp-verticals-inner">
        <div className="gp-verticals-head">
          <div>
            <Reveal><span className="gp-mono gp-verticals-label">{t.verticalsLabel}</span></Reveal>
            <Reveal delay={80}><h2 className="gp-display gp-heading">{t.verticalsTitle} <em>{t.verticalsAccent}</em></h2></Reveal>
          </div>
          <Reveal delay={140}><p className="gp-verticals-intro">{t.verticalsIntro}</p></Reveal>
        </div>

        <Reveal delay={160}>
          <figure className="gp-verticals-photo">
            <img src="/heritage/team.jpg" alt={t.verticalsPhotoAlt} width={1280} height={854} loading="lazy" decoding="async" />
          </figure>
        </Reveal>

        <ol className="gp-pillars">
          {t.pillars.map((p, i) => (
            <li key={p.title}>
              <Reveal delay={120 + i * 90}>
                <span className="gp-mono gp-pillar-num">0{i + 1}</span>
                <h3 className="gp-pillar-title">{p.title}</h3>
                <p className="gp-pillar-desc">{p.desc}</p>
              </Reveal>
            </li>
          ))}
        </ol>

        <div className="gp-sponsor">
          <Reveal className="gp-sponsor-media">
            <figure className="gp-sponsor-photo">
              <img src="/heritage/omar-assar.jpg" alt={t.sponsorPhotoAlt} width={1600} height={1066} loading="lazy" decoding="async" />
              <figcaption className="gp-mono">{t.sponsorCaption}</figcaption>
            </figure>
          </Reveal>
          <div className="gp-sponsor-copy">
            <Reveal delay={80}><span className="gp-mono gp-verticals-label">{t.sponsorLabel}</span></Reveal>
            <Reveal delay={140}><h2 className="gp-display gp-heading">{t.sponsorTitle} <em>{t.sponsorAccent}</em></h2></Reveal>
            <Reveal delay={200}><p className="gp-verticals-intro">{t.sponsorDesc}</p></Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
