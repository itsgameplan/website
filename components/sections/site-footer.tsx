import { ArrowUpRight, ArrowUp } from "lucide-react";
import { chapters, type Chapter, type Dictionary, type Locale } from "@/i18n/translations";

// Placeholder destinations — swap in the real addresses and profiles.
const CONTACT_EMAIL = "hello@gameplan.example";
const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X", href: "#" },
];
const DOOR_LINKS = { venture: "#", advisory: "#" };

/**
 * Site footer. Carries the last chapter id ("apply") so the chapter menu, the
 * progress meter and the background palette all end on it.
 */
export function SiteFooter({ t, locale, onNavigate, onReplay }: {
  t: Dictionary; locale: Locale; onNavigate: (id: Chapter) => void; onReplay: () => void;
}) {
  const explore = chapters.filter((id) => id !== "home" && id !== "apply");
  return (
    <footer id="apply" className="gp-site-footer">

      <div className="gp-footer-grid">
        <div className="gp-footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gameplan-logo-white.png" alt="Gameplan" width={148} height={42} />
          <p>{t.heroDesc}</p>
          <a className="gp-footer-mail" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </div>
        <nav className="gp-footer-col" aria-label={t.footerExplore}>
          <span className="gp-mono">{t.footerExplore}</span>
          {explore.map((id) => <button key={id} onClick={() => onNavigate(id)}>{t[id]}</button>)}
        </nav>
        <div className="gp-footer-col">
          <span className="gp-mono">{t.footerWork}</span>
          <a href={DOOR_LINKS.venture}>{t.doorOneTitle}</a>
          <a href={DOOR_LINKS.advisory}>{t.doorTwoTitle}</a>
        </div>
        <div className="gp-footer-col">
          <span className="gp-mono">{t.footerFollow}</span>
          {SOCIALS.map((s) => <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">{s.label}<ArrowUpRight size={14}/></a>)}
        </div>
      </div>

      <div className="gp-footer-bar gp-mono">
        <span>© GAMEPLAN 2026 · {t.footerRights}</span>
        <span className="gp-footer-tag">{t.footer}</span>
        <div className="gp-footer-actions">
          <a href={locale === "en" ? "/ar" : "/en"} hrefLang={locale === "en" ? "ar" : "en"}>{locale === "en" ? "العربية" : "English"}</a>
          <button onClick={() => onNavigate("home")}>{t.footerTop}<ArrowUp size={13}/></button>
          <button onClick={onReplay}>{t.replay} ↺</button>
        </div>
      </div>

      <div className="gp-footer-wordmark gp-display" aria-hidden="true">GAMEPLAN</div>
    </footer>
  );
}
