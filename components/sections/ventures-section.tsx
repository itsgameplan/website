import type { CSSProperties } from "react";
import type { Dictionary } from "@/i18n/translations";
import { CairoDiagram } from "@/components/ui/cairo-diagram";

const item = (i: number) => ({ ["--i" as string]: i }) as CSSProperties;

/**
 * Cairo Tech — earth moving & mining. The section is a scroll spacer; its copy
 * lives in a pinned layer the 3D scene drives: it rises in as the loader forms,
 * holds, and leaves as soon as the loader starts morphing into the vault.
 */
export function VenturesSection({ t }: { t: Dictionary; }) {
  return (
      <section id="ventures" className="gp-ventures gp-pinned-section">
        <div id="gp-pin-loader" className="gp-pin-layer gp-section">
          <div className="gp-section-inner">
            <div className="gp-section-split">
              <h2 className="gp-display gp-heading">
                <span className="gp-pin-item" style={item(1)}>{t.venturesTitle}</span>
                <em className="gp-pin-item" style={item(2)}>{t.venturesAccent}</em>
              </h2>
              <p className="gp-pin-item gp-cairo-coords gp-mono" style={item(3)}>{t.venturesCoords}</p>
              <p className="gp-pin-item gp-section-description" style={item(4)}>{t.venturesDesc}</p>
            </div>
            <CairoDiagram t={t} />
          </div>
        </div>
      </section>
  );
}
