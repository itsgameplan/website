/**
 * Point-cloud icons for the "We advise" chapter: the hero's DNA strand re-forms into one icon per
 * service as the visitor scrolls. Built with the same primitives, lighting and ordering as the
 * other morph targets (lib/morph-shapes.ts), so particle i lands in a similar region of every icon
 * and each morph reads as a flow.
 *
 * Order matches `adviseItems` in i18n/translations.ts.
 */
import {
  add, box, build, cylinder, CREAM, GOLD, GOLD_DEEP, norm, orderedIndices, rng, rotX, rotZ, sphere, TAU, torus, tube,
  type Part, type V3,
} from "@/lib/morph-shapes";

export const ADVISE_ICON_NAMES = ["strategy", "governance", "marketing", "partnerships", "launch", "sales", "events"] as const;
/** furthest point of every icon from its centre, in model units */
const ICON_FIT = 1.55;

/* ---------- helpers on top of the shared primitives ---------- */

/** rotate every sample of a part (position about `pivot`, and its normal) */
function rotated(part: Part, fn: (v: V3) => V3, pivot: V3 = [0, 0, 0]): Part {
  return {
    ...part,
    sample: (r) => {
      const s = part.sample(r);
      if (!s) return null;
      return { ...s, p: add(fn([s.p[0] - pivot[0], s.p[1] - pivot[1], s.p[2] - pivot[2]]), pivot), n: fn(s.n) };
    },
  };
}
const turnZ = (part: Part, a: number, pivot: V3 = [0, 0, 0]) => rotated(part, (v) => rotZ(v, a), pivot);
const turnX = (part: Part, a: number, pivot: V3 = [0, 0, 0]) => rotated(part, (v) => rotX(v, a), pivot);
const solid = (c: V3) => () => c;

/** open cone frustum along +y: radius r0 at y0, r1 at y1 (side surface only) */
function frustumY(center: V3, y0: number, r0: number, y1: number, r1: number, color: V3, opts: { density?: number } = {}): Part {
  const h = y1 - y0;
  const slant = Math.hypot(h, r1 - r0);
  return {
    area: Math.PI * (r0 + r1) * slant,
    density: opts.density,
    sample: (r) => {
      // area-weighted height: pick t so wider rings get more points
      const u = r();
      const t = r0 === r1 ? u : (Math.sqrt(r0 * r0 + u * (r1 * r1 - r0 * r0)) - r0) / (r1 - r0);
      const rad = r0 + (r1 - r0) * t;
      const a = r() * TAU;
      const p: V3 = [center[0] + Math.cos(a) * rad, center[1] + y0 + h * t, center[2] + Math.sin(a) * rad];
      const n = norm([Math.cos(a) * h, -(r1 - r0), Math.sin(a) * h]);
      return { p, n, c: color };
    },
  };
}

/** part of a torus (ring in the xy-plane), between angles `from` and `to` */
function arc(center: V3, R: number, rt: number, from: number, to: number, color: V3): Part {
  const ring = torus(center, R, rt, solid(color));
  return {
    area: ring.area * ((to - from) / TAU),
    sample: (r) => {
      for (let i = 0; i < 40; i++) {
        const s = ring.sample(r);
        if (!s) continue;
        const th = Math.atan2(s.p[1] - center[1], s.p[0] - center[0]);
        if (th >= from && th <= to) return s;
      }
      return null;
    },
  };
}

/** a gear in the xy-plane: rim, faces with a hub hole, and teeth around the edge */
function gear(center: V3, R: number, teeth: number, thick: number, color: V3, accent: V3): Part[] {
  const parts: Part[] = [
    cylinder(center, 2, R, thick, (local, onCap, rad) => (onCap && rad < R * 0.32 ? null : rad < R * 0.42 && onCap ? accent : color)),
    cylinder(center, 2, R * 0.32, thick, () => accent, { caps: false }),
  ];
  for (let k = 0; k < teeth; k++) {
    const a = (k / teeth) * TAU;
    const tooth = box([center[0] + R + R * 0.13, center[1], center[2]], [R * 0.3, R * 0.3, thick], () => color);
    parts.push(turnZ(tooth, a, center));
  }
  return parts;
}

/* ---------- the seven icons ---------- */

/** 01 Strategy — a target with an arrow in the bullseye */
function strategy(): Part[] {
  return [
    torus([0, 0, 0], 1.05, 0.075, solid(CREAM)),
    torus([0, 0, 0], 0.72, 0.075, solid(GOLD)),
    torus([0, 0, 0], 0.4, 0.075, solid(CREAM)),
    sphere([0, 0, 0], 0.16, solid(GOLD)),
    tube([0.06, 0.06, 0.05], [1.35, 1.25, 0.9], 0.05, GOLD_DEEP, { density: 1.6 }),
    // fletching: a V of short shafts at the tail
    tube([1.35, 1.25, 0.9], [1.08, 1.4, 0.75], 0.035, GOLD, { density: 1.6 }),
    tube([1.35, 1.25, 0.9], [1.5, 0.98, 0.75], 0.035, GOLD, { density: 1.6 }),
    tube([1.2, 1.1, 0.8], [0.95, 1.24, 0.65], 0.035, GOLD, { density: 1.6 }),
    tube([1.2, 1.1, 0.8], [1.34, 0.85, 0.65], 0.035, GOLD, { density: 1.6 }),
  ];
}

/** 02 Governance & operations — two meshing gears */
function governance(): Part[] {
  return [
    ...gear([-0.38, 0.28, 0], 0.72, 12, 0.32, CREAM, GOLD),
    ...gear([0.78, -0.62, 0], 0.46, 9, 0.32, GOLD, CREAM).map((p) => turnZ(p, 0.17, [0.78, -0.62, 0])),
  ];
}

/** 03 Marketing & content — a megaphone with sound waves */
function marketing(): Part[] {
  // the horn points along +x: build it along +y, then turn it
  const horn = [
    frustumY([0, 0, 0], -0.75, 0.2, 0.55, 0.68, CREAM),
    torus([0, 0.55, 0], 0.68, 0.05, solid(GOLD)),
    cylinder([0, -0.88, 0], 1, 0.24, 0.26, () => GOLD),
  ].map((p) => rotated(p, (v) => rotZ(v, -Math.PI / 2)));
  return [
    ...horn,
    // grip under the body
    tube([-0.45, -0.18, 0], [-0.62, -0.8, 0], 0.09, GOLD_DEEP, { density: 1.4 }),
    // sound waves in front of the bell
    arc([0.55, 0, 0], 0.98, 0.05, -0.75, 0.75, GOLD),
    arc([0.55, 0, 0], 1.3, 0.05, -0.62, 0.62, CREAM),
  ].map((p) => rotated(p, (v) => [v[0] - 0.25, v[1], v[2]]));
}

/** 04 Partnerships & sponsorship — two interlocking rings */
function partnerships(): Part[] {
  // one ring tilted a little towards the viewer, the other turned through it, so they link
  return [
    rotated(torus([0, 0, 0], 0.72, 0.13, solid(CREAM)), (v) => add(rotX(v, 0.35), [-0.42, 0, 0])),
    rotated(torus([0, 0, 0], 0.72, 0.13, solid(GOLD)), (v) => add(rotX(v, -1.15), [0.42, 0, 0])),
  ];
}

/** 05 Product launch — a rocket taking off, with its flame */
function launch(): Part[] {
  const body: Part[] = [
    cylinder([0, 0, 0], 1, 0.34, 1.25, (local, onCap) => (onCap ? null : Math.abs(local[1] - 0.18) < 0.07 ? GOLD : CREAM), { caps: false }),
    frustumY([0, 0, 0], 0.62, 0.34, 1.2, 0.02, GOLD),
    torus([0, 0.22, 0.34], 0.13, 0.035, solid(GOLD_DEEP)),
    frustumY([0, 0, 0], -0.95, 0.24, -0.62, 0.3, GOLD_DEEP),
    // exhaust flame
    frustumY([0, 0, 0], -1.55, 0.03, -0.98, 0.21, GOLD, { density: 0.8 }),
  ];
  for (let k = 0; k < 3; k++) {
    const fin = box([0.48, -0.5, 0], [0.32, 0.45, 0.05], () => GOLD);
    body.push(rotated(fin, (v) => { const a = (k / 3) * TAU + 0.5; const c = Math.cos(a), s = Math.sin(a); return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]]; }));
  }
  // lean into the climb
  return body.map((p) => turnZ(p, -0.62));
}

/** 06 Commercial & sales — rising bars with a trend arrow */
function sales(): Part[] {
  const heights = [0.5, 0.82, 1.12, 1.5];
  const parts: Part[] = heights.map((h, k) =>
    box([-0.84 + k * 0.56, -0.95 + h / 2, 0], [0.36, h, 0.34], () => (k === heights.length - 1 ? GOLD : CREAM)));
  parts.push(tube([-1.25, -0.97, 0], [1.25, -0.97, 0], 0.03, GOLD_DEEP));
  const line: V3[] = [[-1.15, -0.25, 0.32], [-0.45, 0.12, 0.32], [0.05, -0.08, 0.32], [1.05, 0.92, 0.32]];
  for (let k = 0; k < line.length - 1; k++) parts.push(tube(line[k], line[k + 1], 0.055, GOLD, { density: 1.5 }));
  const tip = line[line.length - 1];
  parts.push(tube(tip, add(tip, [-0.36, 0.0, 0]), 0.055, GOLD, { density: 1.5 }));
  parts.push(tube(tip, add(tip, [0.0, -0.36, 0]), 0.055, GOLD, { density: 1.5 }));
  return parts;
}

/** 07 Events — a calendar page with binder rings and one date picked out */
function events(): Part[] {
  const W = 1.9, H = 1.55, D = 0.16, top = 0.55;
  const cols = 4, rows = 3, cellW = W / cols, cellH = (H - 0.42) / rows;
  return [
    // page: the front face shows a grid of date cells (gaps are holes), one of them gold
    box([0, -0.12, 0], [W, H, D], (local, _edge, face) => {
      if (face !== 5) return CREAM;
      const y = local[1] + H / 2;               // 0 at the bottom of the page
      if (y > H - 0.42) return GOLD;              // header band
      const cx = (local[0] + W / 2) / cellW, cy = y / cellH;
      const fx = cx - Math.floor(cx), fy = cy - Math.floor(cy);
      if (fx < 0.16 || fx > 0.84 || fy < 0.16 || fy > 0.84) return null;
      return Math.floor(cx) === 2 && Math.floor(cy) === 1 ? GOLD : CREAM;
    }),
    // binder rings
    tube([-0.5, top + 0.0, 0], [-0.5, top + 0.32, 0], 0.06, GOLD_DEEP, { density: 1.6 }),
    tube([0.5, top + 0.0, 0], [0.5, top + 0.32, 0], 0.06, GOLD_DEEP, { density: 1.6 }),
    torus([-0.5, top + 0.32, 0], 0.08, 0.035, solid(GOLD_DEEP)),
    torus([0.5, top + 0.32, 0], 0.08, 0.035, solid(GOLD_DEEP)),
  ].map((p) => turnX(p, -0.18));
}

const BUILDERS: Record<(typeof ADVISE_ICON_NAMES)[number], () => Part[]> = { strategy, governance, marketing, partnerships, launch, sales, events };

/**
 * One position + colour per particle for each icon (particles 0 … count-1; the scene leaves its
 * ambient dust alone). Positions are ordered along the shared axis, like every other form.
 */
export function createAdviseIcon(k: number, count: number) {
  const name = ADVISE_ICON_NAMES[k];
  const b = build(count, BUILDERS[name](), 307 + k * 17, { fit: ICON_FIT });
  const idx = orderedIndices(b.pos, rng(211 + k));
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  idx.forEach((src, dst) => {
    positions.set(b.pos[src], dst * 3);
    colors.set(b.col[src], dst * 3);
  });
  return { name, positions, colors };
}

/** every icon at once (scripts, tests); the scene builds them one per idle slot instead */
export const createAdviseIcons = (count: number) => ADVISE_ICON_NAMES.map((_, k) => createAdviseIcon(k, count));
