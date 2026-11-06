import type { Dictionary, Chapter } from "@/i18n/translations";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function HeroSection({ t, onNavigate, replayKey }: { t: Dictionary; replayKey: number; onNavigate: (id: Chapter) => void; }) {
  return (
      <section id="home" className="gp-hero gp-sky gp-grid" key={replayKey}>
        <div className="gp-hero-content">
          <div className="gp-hero-topline gp-intro-1"><span className="gp-plus">✳</span> {t.eyebrow}<span className="gp-coordinates">{"25° 12' / 55° 16'"}</span></div>
          <h1 className="gp-display gp-hero-title"><span className="gp-intro-2">{t.heroA}</span><span className="gp-intro-3">{t.heroB}</span></h1>
          <div className="gp-hero-bottom gp-intro-4">
            <p>{t.heroDesc}</p>
            <button className="gp-primary" onClick={() => onNavigate("ventures")}>{t.explore}<ArrowUpRight size={19}/></button>
          </div>
        </div>
        <div className="gp-hero-footer"><span>© GAMEPLAN 2026</span><button onClick={() => onNavigate("ventures")}>{t.scroll} <ArrowDownRight size={16}/></button><span>{t.heroSignoff}</span></div>
      
      </section>
  );
}
