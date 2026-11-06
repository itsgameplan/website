"use client";

import type { Dictionary } from "@/i18n/translations";

/**
 * Cairo Tech mark drawn as an engineering sheet: the four-course pyramid at
 * true Great Pyramid proportions (51.84° faces), with dimension lines, an
 * angle callout and a title block. Lines draw in and the courses stack up
 * while the loader is on screen, and reverse when it leaves.
 */

const APEX = { x: 250, y: 126 };
const BASE_Y = 380;
const HALF_BASE = 200;
const halfAt = (y: number) => ((y - APEX.y) / (BASE_Y - APEX.y)) * HALF_BASE;

// courses from the base up: [bottom y, top y]
const COURSES: [number, number][] = [[380, 318], [310, 250], [242, 190], [182, APEX.y]];

function coursePolys([bottom, top]: [number, number]) {
  const hb = halfAt(bottom), ht = halfAt(top);
  const cx = APEX.x;
  const left = `${cx - hb},${bottom} ${cx},${bottom} ${cx},${top} ${cx - ht},${top}`;
  const right = `${cx},${bottom} ${cx + hb},${bottom} ${cx + ht},${top} ${cx},${top}`;
  return { left, right };
}

/** Drawn in and erased by the 3D timeline: the scene sets `gp-loader-on` on <html> while the loader is on screen. */
export function CairoDiagram({ t }: { t: Dictionary }) {
  const angleEnd = { x: 50 + 46 * Math.cos((51.84 * Math.PI) / 180), y: BASE_Y - 46 * Math.sin((51.84 * Math.PI) / 180) };

  return (
    <div className="gp-cairo-diagram" aria-hidden="true">
      <svg viewBox="0 0 520 470" role="presentation">
        {/* registration marks */}
        {[[14, 14], [506, 14], [14, 456], [506, 456]].map(([x, y]) => (
          <path key={`${x}-${y}`} className="ln" pathLength={1} style={{ ["--d" as string]: "0s" }} d={`M${x - 6} ${y}H${x + 6}M${x} ${y - 6}V${y + 6}`} />
        ))}

        {/* centre axis (marching dashes) */}
        <line className="dash" x1={APEX.x} y1={92} x2={APEX.x} y2={400} />

        {/* courses stack from the base up */}
        {COURSES.map((c, i) => {
          const { left, right } = coursePolys(c);
          return (
            <g key={i} className="course" style={{ ["--d" as string]: `${0.35 + i * 0.18}s` }}>
              <polygon points={left} fill="#f5b800" />
              <polygon points={right} fill="#d69e0a" />
            </g>
          );
        })}

        {/* outline of the full pyramid */}
        <path className="ln" pathLength={1} style={{ ["--d" as string]: "0.1s" }}
          d={`M${APEX.x - HALF_BASE} ${BASE_Y}L${APEX.x} ${APEX.y}L${APEX.x + HALF_BASE} ${BASE_Y}Z`} />

        {/* base dimension */}
        <path className="ln" pathLength={1} style={{ ["--d" as string]: "0.6s" }}
          d={`M50 ${BASE_Y + 4}V420M450 ${BASE_Y + 4}V420M50 410H450M44 404L56 416M444 404L456 416`} />
        <text className="lbl" x={250} y={432} textAnchor="middle" style={{ ["--d" as string]: "1.1s" }}>{t.diagramBase}</text>

        {/* height dimension */}
        <path className="ln" pathLength={1} style={{ ["--d" as string]: "0.75s" }}
          d={`M${APEX.x + 8} ${APEX.y}H498M454 ${BASE_Y}H498M490 ${APEX.y}V${BASE_Y}M484 ${APEX.y - 6}L496 ${APEX.y + 6}M484 ${BASE_Y - 6}L496 ${BASE_Y + 6}`} />
        <text className="lbl" x={508} y={253} textAnchor="middle" transform="rotate(-90 508 253)" style={{ ["--d" as string]: "1.2s" }}>{t.diagramHeight}</text>

        {/* face angle */}
        <path className="ln" pathLength={1} style={{ ["--d" as string]: "0.9s" }}
          d={`M96 ${BASE_Y}A46 46 0 0 0 ${angleEnd.x.toFixed(1)} ${angleEnd.y.toFixed(1)}`} />
        <text className="lbl" x={104} y={366} style={{ ["--d" as string]: "1.25s" }}>51.84°</text>

        {/* course callout */}
        <path className="ln" pathLength={1} style={{ ["--d" as string]: "1s" }} d={`M${APEX.x + 14} ${APEX.y + 30}L372 74H470`} />
        <text className="lbl" x={376} y={66} style={{ ["--d" as string]: "1.3s" }}>{t.diagramCourse}</text>
        <text className="lbl" x={376} y={90} style={{ ["--d" as string]: "1.35s" }}>{t.diagramTol}</text>

        {/* title block */}
        <path className="ln" pathLength={1} style={{ ["--d" as string]: "0.5s" }} d="M14 440H506" />
        <text className="lbl" x={14} y={458} style={{ ["--d" as string]: "1.4s" }}>{t.diagramTitle}</text>
      </svg>
      <div className="gp-cairo-wordmark">{t.cairoName}</div>
    </div>
  );
}
