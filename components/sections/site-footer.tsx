import { ArrowUpRight, ArrowUp } from "lucide-react";
import { chapters, type Chapter, type Dictionary, type Locale } from "@/i18n/translations";
import { CONTACT_EMAIL, pagePath } from "@/lib/site-links";

// Placeholder profiles — swap in the real ones.
const SOCIALS = [
  { label: "Instagram", href: "https://www.instagram.com/gameeplan/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/gameeplan/posts/?feedView=all" },
];

/**
 * Site footer. Carries the last chapter id ("apply") so the chapter menu, the
 * progress meter and the background palette all end on it.
 */
export function SiteFooter({ t, locale, onNavigate, onReplay, langHref }: {
  t: Dictionary; locale: Locale; onNavigate: (id: Chapter) => void; onReplay: () => void;
  /** where the language switch goes (defaults to the other home page) */
  langHref?: string;
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
          <a href={pagePath(locale, "venture")}>{t.doorOneTitle}</a>
          <a href={pagePath(locale, "advisory")}>{t.doorTwoTitle}</a>
          <a href={pagePath(locale, "contact")}>{t.apply}</a>
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
          <a href={langHref ?? (locale === "en" ? "/ar" : "/en")} hrefLang={locale === "en" ? "ar" : "en"}>{locale === "en" ? "العربية" : "English"}</a>
          <button onClick={() => onNavigate("home")}>{t.footerTop}<ArrowUp size={13}/></button>
          <button onClick={onReplay}>{t.replay} ↺</button>
        </div>
      </div>

      <div className="gp-footer-wordmark gp-display" aria-hidden="true">GAMEPLAN</div>
    </footer>
  );
}
