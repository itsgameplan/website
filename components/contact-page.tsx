"use client";

import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { PageShell } from "@/components/page-shell";
import { BriefForm } from "@/components/brief-form";
import { programs } from "@/i18n/programs";
import { briefForms } from "@/i18n/brief-forms";
import type { Dictionary, Locale } from "@/i18n/translations";
import { CONTACT_EMAIL, pagePath } from "@/lib/site-links";

/** Contact page: a short intro, the click-to-compose form, then direct email and the two doors. */
export function ContactPage({ locale, t }: { locale: Locale; t: Dictionary }) {
  const p = programs[locale];
  const brief = briefForms[locale].contact;
  const Forward = locale === "ar" ? ArrowLeft : ArrowRight;
  return (
    <PageShell locale={locale} t={t} page="contact">
      <section className="gp-page-hero gp-contact-hero">
        <div className="gp-page-inner">
          <Reveal><span className="gp-page-tag gp-mono">{p.contact.tag}</span></Reveal>
          <Reveal delay={80}><h1 className="gp-display gp-page-title">{brief.title} <em>{brief.accent}</em></h1></Reveal>
          <Reveal delay={140}><p className="gp-page-intro">{brief.intro}</p></Reveal>
          <Reveal delay={200}><BriefForm locale={locale} kind="contact" /></Reveal>
        </div>
      </section>

      <section className="gp-page-block">
        <div className="gp-page-inner gp-contact-more">
          <Reveal>
            <div>
              <h2 className="gp-page-label gp-mono">{p.contact.directTitle}</h2>
              <p className="gp-contact-direct">{p.contact.directDesc}{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} dir="ltr"><Mail size={18} />{CONTACT_EMAIL}</a>
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <h2 className="gp-page-label gp-mono">{p.contact.doorsTitle}</h2>
              <div className="gp-contact-doors">
                <a className="gp-page-other gp-mono" href={pagePath(locale, "venture")}>{p.advisory.otherDoor /* "Join the Venture Program" */}<Forward size={15} /></a>
                <a className="gp-page-other gp-mono" href={pagePath(locale, "advisory")}>{p.venture.otherDoor}<Forward size={15} /></a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageShell>
  );
}
