import type { Dictionary } from "@/i18n/translations";
import { ArrowUpRight } from "lucide-react";
import type { CSSProperties } from "react";

// Placeholder destinations — swap in the real store and website links.
const ASL_LINKS = { appStore: "#", googlePlay: "#", website: "#" };

const AppleGlyph = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor">
    <path d="M16.37 12.6c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.7-3.19-1.73-1.35-.14-2.65.8-3.34.8-.7 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.2-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.74 2.2 1.1-.04 1.52-.71 2.85-.71 1.33 0 1.7.71 2.87.69 1.18-.02 1.93-1.08 2.65-2.14.84-1.22 1.18-2.41 1.2-2.47-.03-.01-2.29-.88-2.3-3.5zM14.2 6.13c.6-.74 1.01-1.75.9-2.77-.87.04-1.93.58-2.55 1.31-.56.65-1.05 1.69-.92 2.69.97.07 1.96-.49 2.57-1.23z" />
  </svg>
);
const PlayGlyph = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path d="M4.2 2.6 13.6 12l-9.4 9.4c-.3-.2-.5-.6-.5-1V3.6c0-.4.2-.8.5-1z" fill="#34d399" />
    <path d="M16.9 8.7 13.6 12 4.2 2.6c.3-.2.8-.2 1.2 0z" fill="#60a5fa" />
    <path d="M16.9 15.3 5.4 21.4c-.4.2-.9.2-1.2 0L13.6 12z" fill="#f87171" />
    <path d="M20.3 10.6c.8.5.8 1.8 0 2.3l-3.4 2.4L13.6 12l3.3-3.3z" fill="#fbbf24" />
  </svg>
);

const item = (i: number) => ({ ["--i" as string]: i }) as CSSProperties;

/**
 * ASL — the gold buying app. The section is a scroll spacer; its copy lives in
 * a pinned layer the 3D scene drives: it rises in as the vault appears, holds,
 * and vanishes as the camera passes through the vault door.
 */
export function AdvisorySection({ t }: { t: Dictionary; }) {
  return (
      <section id="advisory" className="gp-advisory gp-pinned-section">
        <div id="gp-pin-vault" className="gp-pin-layer gp-section">
          <div className="gp-section-inner">
            <div className="gp-pin-item gp-eyebrow gp-eyebrow-light" style={item(0)}><span className="gp-white-square"/>{t.advisoryTag}</div>
            <h2 className="gp-display gp-heading gp-heading-white">
              <span className="gp-pin-item" style={item(1)}>{t.advisoryTitle}</span>
              <em className="gp-pin-item" style={item(2)}>{t.advisoryAccent}</em>
            </h2>
            <div className="gp-advisory-lower">
              <p className="gp-pin-item gp-advisory-description" style={item(3)}>{t.advisoryDesc}</p>
              <div className="gp-pin-item gp-asl-actions" style={item(4)}>
                <a className="gp-store-btn" href={ASL_LINKS.appStore} target="_blank" rel="noopener noreferrer">
                  <AppleGlyph /><span><small>{t.aslAppStoreSmall}</small>{t.aslAppStore}</span>
                </a>
                <a className="gp-store-btn" href={ASL_LINKS.googlePlay} target="_blank" rel="noopener noreferrer">
                  <PlayGlyph /><span><small>{t.aslPlaySmall}</small>{t.aslPlay}</span>
                </a>
                <a className="gp-asl-web" href={ASL_LINKS.website} target="_blank" rel="noopener noreferrer">
                  {t.aslWebsite}<ArrowUpRight size={16}/>
                </a>
              </div>
              <div className="gp-advisory-list">{[t.advisoryOne, t.advisoryTwo, t.advisoryThree].map((label, index) =>
                <div key={label} className="gp-pin-item gp-advisory-row" style={item(5 + index)}><span>0{index + 1}</span><strong>{label}</strong></div>
              )}</div>
            </div>
          </div>
        </div>
      </section>
  );
}
