"use client";

import type { ReactNode } from "react";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import { CrosshairCursor } from "@/components/ui/crosshair-cursor";
import { SiteFooter } from "@/components/sections/site-footer";
import { programs } from "@/i18n/programs";
import type { Chapter, Dictionary, Locale } from "@/i18n/translations";
import { pagePath, type NavPage, type SitePage } from "@/lib/site-links";
import { LangLabel } from "@/components/ui/lang-label";

export const NAV_PAGES: NavPage[] = ["venture", "advisory", "contact"];

/** Shared frame for the standalone pages: backdrop, header (logo, page links, language), footer. */
export function PageShell({ locale, t, page, children }: { locale: Locale; t: Dictionary; page: SitePage; children: ReactNode }) {
  const p = programs[locale];
  const other: Locale = locale === "en" ? "ar" : "en";
  const goHome = (id: Chapter) => { window.location.href = id === "home" ? `/${locale}` : `/${locale}#${id}`; };
  return (
    <div className={`gp-site gp-page gp-page-${page} ${locale === "ar" ? "gp-ar" : ""}`}>
      <SmoothScroll />
      <CrosshairCursor tapLabel={t.tap} />
      <div className="gp-page-backdrop" aria-hidden="true"><span /><span /><span /></div>
      <header className="gp-header">
        <a className="gp-logo" href={`/${locale}`} aria-label={t.backToTop} data-cursor={p.home}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gameplan-logo-white.png" alt="Gameplan" />
        </a>
        <nav className="gp-nav" aria-label={t.primaryNavigation}>
          {NAV_PAGES.map((k) => (
            <a key={k} className={`gp-nav-link gp-nav-page ${k === page ? "is-current" : ""}`} href={pagePath(locale, k)} aria-current={k === page ? "page" : undefined}>
              {p.nav[k]}
            </a>
          ))}
          <a className="gp-lang" href={pagePath(other, page)} hrefLang={other} aria-label={t.switchLanguage}>
            <LangLabel locale={locale} />
          </a>
        </nav>
      </header>
      <main>{children}</main>
      <SiteFooter t={t} locale={locale} onNavigate={goHome} onReplay={() => goHome("home")} langHref={pagePath(other, page)} />
    </div>
  );
}
