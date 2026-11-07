"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, Volume2, VolumeX, X } from "lucide-react";
import { SmoothScroll } from "@/components/ui/smooth-scroll";
import dynamic from "next/dynamic";
import { CrosshairCursor } from "@/components/ui/crosshair-cursor";
import { HeroSection } from "@/components/sections/hero-section";
import { SplitSection } from "@/components/sections/split-section";
import { VerticalsSection } from "@/components/sections/verticals-section";
import { AboutSection } from "@/components/sections/about-section";
import { VenturesSection } from "@/components/sections/ventures-section";
import { AdvisorySection } from "@/components/sections/advisory-section";
import { MomentumSection } from "@/components/sections/momentum-section";
import { ProcessSection } from "@/components/sections/process-section";
import { SiteFooter } from "@/components/sections/site-footer";
import { chapters, type Chapter, type Dictionary, type Locale } from "@/i18n/translations";
import { programs } from "@/i18n/programs";
import { pagePath, type SitePage } from "@/lib/site-links";
import { LangLabel } from "@/components/ui/lang-label";

const NAV_PAGES: SitePage[] = ["venture", "advisory", "contact"];

const MorphingParticleScene = dynamic(() => import("@/components/ui/morphing-particle-scene").then((mod) => mod.MorphingParticleScene), { ssr: false });

export function GameplanHome({ locale, t }: { locale: Locale; t: Dictionary }) {
  const [active, setActive] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const candidates = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (candidates[0]) setActive(chapters.indexOf(candidates[0].target.id as typeof chapters[number]));
    }, { rootMargin: "-25% 0px -35% 0px", threshold: [0, 0.15, 0.35, 0.6] });
    chapters.forEach((id) => { const node = document.getElementById(id); if (node) observer.observe(node); });
    return () => observer.disconnect();
  }, []);

  const jump = (id: Chapter) => {
    setMenuOpen(false);
    const target = document.getElementById(id);
    if (!target) return;
    // glide with the smooth-scroll engine when it is running, so jumps feel like the rest of the page
    if (window.__gpLenis && !reducedMotion) window.__gpLenis.scrollTo(target, { duration: 1.8 });
    else target.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth" });
  };
  const playSound = () => {
    if (!soundOn) return;
    try {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(620, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(390, context.currentTime + 0.07);
      gain.gain.setValueAtTime(0.025, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.09);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.09);
      oscillator.onended = () => void context.close();
    } catch { /* audio is optional */ }
  };
  const navClick = (id: Chapter) => { playSound(); jump(id); };

  return <div className={`gp-site ${locale === "ar" ? "gp-ar" : ""}`}>
    <SmoothScroll />
    <CrosshairCursor tapLabel={t.tap} />
    <header className="gp-header">
      <button className="gp-logo" onClick={() => navClick("home")} aria-label={t.backToTop} data-cursor={t.top}>
        <img src="/gameplan-logo-white.png" alt="Gameplan" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextElementSibling?.classList.add("gp-logo-fallback-show"); }} />
        <span className="gp-logo-fallback">GAMEPLAN<span className="gp-logo-dot">.</span></span>
      </button>
      <nav className="gp-nav" aria-label={t.primaryNavigation}>
        {NAV_PAGES.map((k) => <a key={k} className="gp-nav-link gp-nav-page" href={pagePath(locale, k)}>{programs[locale].nav[k]}</a>)}
        <button className="gp-nav-link gp-skip" onClick={() => navClick("process")}>({t.skip})</button>
        <button className="gp-nav-link" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="gp-chapter-menu">
          ({t.menu}) {menuOpen ? <X size={14}/> : <Menu size={14}/>}
        </button>
        <button className="gp-nav-icon" onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? t.muteSounds : t.enableSounds} aria-pressed={soundOn}>
          {soundOn ? <Volume2 size={17}/> : <VolumeX size={17}/>}
        </button>
        <a className="gp-lang" href={locale === "en" ? "/ar" : "/en"} hrefLang={locale === "en" ? "ar" : "en"} aria-label={t.switchLanguage}>
          <LangLabel locale={locale} />
        </a>
      </nav>
      {menuOpen && <div id="gp-chapter-menu" className="gp-menu">
        {chapters.map((id, index) => <button key={id} onClick={() => navClick(id)}><span>0{index + 1}</span>{t[id]}<ArrowUpRight size={18}/></button>)}
        {NAV_PAGES.map((k) => <a key={k} className="gp-menu-page" href={pagePath(locale, k)}><span>→</span>{programs[locale].nav[k]}<ArrowUpRight size={18}/></a>)}
      </div>}
    </header>

    <aside className="gp-meter gp-meter-light" aria-label={t.chapterProgress}>
      <span className="gp-meter-caption">GP / 0{active + 1}</span>
      <div className="gp-meter-track">
        {chapters.map((id, index) => <button key={id} className={`gp-meter-tick ${index <= active ? "is-passed" : ""} ${index === active ? "is-active" : ""}`}
          onClick={() => navClick(id)} aria-label={`${t.goTo} ${t[id]}`} aria-current={index === active ? "step" : undefined} title={t[id]}/>)}
      </div>
      <span className="gp-meter-caption">0{chapters.length}</span>
    </aside>

    <MorphingParticleScene />
    <main>
      <div id="gp-morph-track" className="gp-morph-track">
        <HeroSection t={t} onNavigate={navClick} replayKey={replayKey} />
        <SplitSection t={t} locale={locale} onNavigate={navClick} />
        <VenturesSection t={t} />
        <AdvisorySection t={t} />
      </div>
      <MomentumSection t={t} />
      <AboutSection t={t} onNavigate={navClick} />
      <VerticalsSection t={t} />
      <ProcessSection t={t} locale={locale} />
    </main>
    <SiteFooter t={t} locale={locale} onNavigate={navClick} onReplay={() => { jump("home"); setReplayKey((k) => k + 1); }} />
    {reducedMotion && <button className="gp-replay-floating" onClick={() => setReplayKey((k) => k + 1)}>{t.replay}</button>}
  </div>;
}
