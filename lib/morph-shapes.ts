/**
 * Deterministic point-cloud targets for the four-chapter 3D story:
 * orb → sport balls → wheel loader → vault.
 *
 * Every target is built from surface-sampled primitives (area-weighted, with
 * normals), lit once at build time, normalised to a common size and then
 * sorted along a shared axis so particle i lands in roughly the same region of
 * every shape. That ordering is what makes the morphs read as a flow rather
 * than a random scramble.
 */
export type FormName = "origin" | "sports" | "loader" | "vault";
export type MorphTarget = { positions: Float32Array; colors: Float32Array };
export type MorphSet = Record<FormName, MorphTarget> & {
  /** Per-particle tag: 0 static, 1 vault door, 2 vault handle, 3 ambient dust. */
  parts: Float32Array;
  /** Vault door hinge (x, z) and handle hub (x, y) in normalised space. */
  vaultHinge: [number, number];
  vaultHub: [number, number];
};

type V3 = [number, number, number];
type Sample = { p: V3; n: V3; c: V3; part?: number };
type Sampler = (r: () => number) => Sample | null;
type Part = { area: number; density?: number; sample: Sampler };

const TAU = Math.PI * 2;
const PART_DUST = 3;

/* ---------- small math helpers ---------- */

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
const norm = (a: V3): V3 => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const hex = (h: number): V3 => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const rotZ = (v: V3, a: number): V3 => { const c = Math.cos(a), s = Math.sin(a); return [c * v[0] - s * v[1], s * v[0] + c * v[1], v[2]]; };
const rotX = (v: V3, a: number): V3 => { const c = Math.cos(a), s = Math.sin(a); return [v[0], c * v[1] - s * v[2], s * v[1] + c * v[2]]; };
function unitDir(r: () => number): V3 {
  const z = r() * 2 - 1;
  const a = r() * TAU;
  const s = Math.sqrt(1 - z * z);
  return [Math.cos(a) * s, z, Math.sin(a) * s];
}

/* ---------- primitive samplers ---------- */

function sphere(center: V3, radius: number, color: (d: V3) => V3, opts: { part?: number; density?: number } = {}): Part {
  return {
    area: 4 * Math.PI * radius * radius,
    density: opts.density,
    sample: (r) => { const d = unitDir(r); return { p: add(center, mul(d, radius)), n: d, c: color(d), part: opts.part }; },
  };
}

/** Axis-aligned box surface. `color` may return null to cut holes. */
function box(center: V3, size: V3, color: (local: V3, edge: number, face: number) => V3 | null, opts: { part?: number; density?: number; faces?: number[] } = {}): Part {
  const [sx, sy, sz] = size;
  const faceAreas = [sy * sz, sy * sz, sx * sz, sx * sz, sx * sy, sx * sy];
  const faces = opts.faces ?? [0, 1, 2, 3, 4, 5];
  const total = faces.reduce((acc, f) => acc + faceAreas[f], 0);
  return {
    area: total,
    density: opts.density,
    sample: (r) => {
      let pick = r() * total;
      let face = faces[faces.length - 1];
      for (const f of faces) { if (pick < faceAreas[f]) { face = f; break; } pick -= faceAreas[f]; }
      const axis = face >> 1;
      const sign = face % 2 === 0 ? -1 : 1;
      const local: V3 = [(r() - 0.5) * sx, (r() - 0.5) * sy, (r() - 0.5) * sz];
      local[axis] = sign * size[axis] / 2;
      const n: V3 = [0, 0, 0];
      n[axis] = sign;
      // distance to the nearest edge of this face
      const others = [0, 1, 2].filter((k) => k !== axis);
      const edge = Math.min(...others.map((k) => size[k] / 2 - Math.abs(local[k])));
      const c = color(local, edge, face);
      if (!c) return null;
      return { p: add(center, local), n, c, part: opts.part };
    },
  };
}

/** Cylinder with caps along a principal axis. */
function cylinder(center: V3, axis: 0 | 1 | 2, radius: number, height: number, color: (local: V3, onCap: boolean, rad: number) => V3 | null, opts: { part?: number; density?: number; caps?: boolean } = {}): Part {
  const side = TAU * radius * height;
  const cap = opts.caps === false ? 0 : Math.PI * radius * radius;
  const total = side + cap * 2;
  const [u, v] = axis === 0 ? [1, 2] : axis === 1 ? [2, 0] : [0, 1];
  return {
    area: total,
    density: opts.density,
    sample: (r) => {
      const local: V3 = [0, 0, 0];
      const n: V3 = [0, 0, 0];
      const a = r() * TAU;
      let onCap = false;
      let rad = radius;
      if (r() * total < side) {
        local[u] = Math.cos(a) * radius; local[v] = Math.sin(a) * radius;
        local[axis] = (r() - 0.5) * height;
        n[u] = Math.cos(a); n[v] = Math.sin(a);
      } else {
        onCap = true;
        rad = Math.sqrt(r()) * radius;
        const s = r() < 0.5 ? -1 : 1;
        local[u] = Math.cos(a) * rad; local[v] = Math.sin(a) * rad;
        local[axis] = s * height / 2;
        n[axis] = s;
      }
      const c = color(local, onCap, rad);
      if (!c) return null;
      return { p: add(center, local), n, c, part: opts.part };
    },
  };
}

/** Thin tube between two points. */
function tube(a: V3, b: V3, radius: number, color: V3, opts: { part?: number; density?: number } = {}): Part {
  const axis = sub(b, a);
  const l = len(axis);
  const t = norm(axis);
  const helper: V3 = Math.abs(t[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = norm(cross(t, helper));
  const v = cross(t, u);
  return {
    area: TAU * radius * l,
    density: opts.density,
    sample: (r) => {
      const ang = r() * TAU;
      const n = add(mul(u, Math.cos(ang)), mul(v, Math.sin(ang)));
      return { p: add(add(a, mul(axis, r())), mul(n, radius)), n, c: color, part: opts.part };
    },
  };
}

/** Torus around the z (or x) axis. */
function torus(center: V3, R: number, rt: number, color: (theta: number, phi: number) => V3, opts: { part?: number; density?: number; axis?: "z" | "x" } = {}): Part {
  return {
    area: 4 * Math.PI * Math.PI * R * rt,
    density: opts.density,
    sample: (r) => {
      const th = r() * TAU, ph = r() * TAU;
      let n: V3 = [Math.cos(th) * Math.cos(ph), Math.sin(th) * Math.cos(ph), Math.sin(ph)];
      let p: V3 = [Math.cos(th) * R + n[0] * rt, Math.sin(th) * R + n[1] * rt, n[2] * rt];
      if (opts.axis === "x") { p = [p[2], p[1], p[0]]; n = [n[2], n[1], n[0]]; }
      return { p: add(center, p), n, c: color(th, ph), part: opts.part };
    },
  };
}

/* ---------- build pipeline ---------- */

const LIGHT = norm([-0.45, 0.75, 0.6]);
const HALF = norm(add(LIGHT, [0, 0, 1]));
const SORT_AXIS = norm([0.78, 0.5, 0.36]);

type Built = { pos: V3[]; col: V3[]; part: number[]; center: V3; scale: number };

function build(count: number, parts: Part[], seed: number, opts: { fit?: number; shade?: number } = {}): Built {
  const r = rng(seed);
  const weights = parts.map((p) => p.area * (p.density ?? 1));
  const total = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.floor((w / total) * count));
  let rest = count - counts.reduce((a, b) => a + b, 0);
  for (let k = 0; rest > 0; k = (k + 1) % counts.length, rest--) counts[k]++;

  const samples: Sample[] = [];
  parts.forEach((part, idx) => {
    for (let n = 0; n < counts[idx]; n++) {
      let s: Sample | null = null;
      for (let tries = 0; tries < 60 && !s; tries++) s = part.sample(r);
      if (s) samples.push(s);
    }
  });
  while (samples.length < count) samples.push(samples[Math.floor(r() * samples.length)]);

  // normalise: centre on bounding box, scale so the furthest point sits at `fit`
  const min: V3 = [Infinity, Infinity, Infinity];
  const max: V3 = [-Infinity, -Infinity, -Infinity];
  for (const s of samples) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], s.p[k]); max[k] = Math.max(max[k], s.p[k]); }
  const center = opts.fit ? mul(add(min, max), 0.5) : [0, 0, 0] as V3;
  let radius = 0;
  for (const s of samples) radius = Math.max(radius, len(sub(s.p, center)));
  const scale = opts.fit ? opts.fit / radius : 1;

  const shade = opts.shade ?? 1;
  const pos: V3[] = [];
  const col: V3[] = [];
  const part: number[] = [];
  for (const s of samples) {
    pos.push(mul(sub(s.p, center), scale));
    const n = norm(s.n);
    const diffuse = Math.max(0, dot(n, LIGHT));
    const spec = Math.pow(Math.max(0, dot(n, HALF)), 28) * 0.35;
    const light = 1 - shade + shade * (0.38 + 0.78 * diffuse);
    col.push([
      Math.min(1, s.c[0] * light + spec * shade),
      Math.min(1, s.c[1] * light + spec * shade),
      Math.min(1, s.c[2] * light + spec * shade),
    ]);
    part.push(s.part ?? 0);
  }
  return { pos, col, part, center, scale };
}

function orderedIndices(points: V3[], r: () => number) {
  // sort along a shared axis with a little jitter so slabs interleave softly
  const keys = points.map((p, i) => ({ i, k: dot(p, SORT_AXIS) + (r() - 0.5) * 0.12 }));
  keys.sort((a, b) => a.k - b.k);
  return keys.map((k) => k.i);
}

/* ---------- palettes ---------- */

const CREAM = hex(0xf3ecd9);
const GOLD = hex(0xe2ae62);
const GOLD_DEEP = hex(0xb9833f);

/* ---------- 01 — origin orb ---------- */

function originParts(): Part[] {
  return [
    sphere([0, 0, 0], 1.18, (d) => {
      const band = Math.abs(d[1]) < 0.06;
      if (band) return GOLD;
      const t = 0.5 + 0.5 * Math.sin(d[0] * 5.2 + d[1] * 3.1) * Math.cos(d[2] * 4.4);
      return mix3(hex(0x5f7d93), CREAM, 0.35 + t * 0.65);
    }),
    // tilted orbit ring
    {
      area: 2.2,
      sample: (r) => {
        const a = r() * TAU;
        const rad = 1.62 + (r() - 0.5) * 0.04;
        let p: V3 = [Math.cos(a) * rad, (r() - 0.5) * 0.02, Math.sin(a) * rad];
        p = rotZ(rotX(p, 0.35), 0.42);
        return { p, n: [0, 0, 1], c: GOLD };
      },
    },
  ];
}

/* ---------- 02 — sport balls ---------- */

const PHI = (1 + Math.sqrt(5)) / 2;
const ICO: V3[] = [];
const DODECA: V3[] = [];
for (const a of [-1, 1]) for (const b of [-1, 1]) {
  ICO.push(norm([0, a, b * PHI]), norm([a, b * PHI, 0]), norm([b * PHI, 0, a]));
  DODECA.push(norm([0, a / PHI, b * PHI]), norm([a / PHI, b * PHI, 0]), norm([b * PHI, 0, a / PHI]));
}
for (const a of [-1, 1]) for (const b of [-1, 1]) for (const c of [-1, 1]) DODECA.push(norm([a, b, c]));

const TENNIS_SEAM: V3[] = Array.from({ length: 160 }, (_, i) => {
  const t = (i / 160) * TAU;
  const A = 0.7, B = 0.3;
  return [A * Math.cos(t) + B * Math.cos(3 * t), A * Math.sin(t) - B * Math.sin(3 * t), Math.sqrt(4 * A * B) * Math.sin(2 * t)];
});

function sportsParts(): Part[] {
  const soccer = sphere([0.05, -0.18, 0.55], 0.92, (raw) => {
    const d = rotX(rotZ(raw, 0.3), 0.25);
    let best = -2, second = -2, pent = false;
    for (const c of ICO) { const s = dot(d, c) - 0.035; if (s > best) { second = best; best = s; pent = true; } else if (s > second) second = s; }
    for (const c of DODECA) { const s = dot(d, c); if (s > best) { second = best; best = s; pent = false; } else if (s > second) second = s; }
    if (best - second < 0.012) return hex(0x8c9196);
    return pent ? hex(0x15191e) : hex(0xf4f3ee);
  });
  const basket = sphere([-1.2, 0.55, -0.45], 0.86, (raw) => {
    const d = rotZ(raw, -0.45);
    const w = 0.028;
    const seam = Math.abs(d[1]) < w || Math.abs(d[0]) < w || Math.abs(Math.abs(d[2]) - 0.58 - 0.32 * d[0] * d[0]) < w * 1.2;
    if (seam) return hex(0x1d1410);
    // pebbled leather
    const grain = 0.92 + 0.08 * Math.sin(raw[0] * 90) * Math.sin(raw[1] * 87) * Math.sin(raw[2] * 93);
    return mul(hex(0xe2692a), grain);
  });
  const tennis = sphere([1.18, 0.95, -0.05], 0.44, (raw) => {
    const d = rotZ(rotX(raw, 0.6), 0.4);
    let m = 9;
    for (const s of TENNIS_SEAM) m = Math.min(m, 1 - dot(d, s));
    return m < 0.0045 ? hex(0xf7f5ea) : hex(0xcfe04a);
  }, { density: 1.25 });
  // American football: prolate spheroid, tilted, with laces
  const tilt = 0.55;
  const football: Part = {
    area: 3.4,
    sample: (r) => {
      const d = unitDir(r);
      const radii: V3 = [0.68, 0.4, 0.4];
      const local: V3 = [d[0] * radii[0], d[1] * radii[1], d[2] * radii[2]];
      const n = norm([local[0] / (radii[0] ** 2), local[1] / (radii[1] ** 2), local[2] / (radii[2] ** 2)]);
      let c = mul(hex(0x7a3d1e), 0.95 + 0.05 * Math.sin(d[0] * 70) * Math.sin(d[2] * 70));
      const facing = d[2] > 0.82 && Math.abs(d[0]) < 0.42;
      if (facing && (Math.abs(d[1]) < 0.035 || (Math.abs(d[1]) < 0.12 && Math.abs(((d[0] + 0.42) % 0.105) - 0.05) < 0.016))) c = hex(0xf6f1e4);
      if (Math.abs(Math.abs(d[0]) - 0.74) < 0.035) c = hex(0xf6f1e4);
      const p = add(rotZ(local, tilt), [1.25, -0.82, 0.05]);
      return { p, n: rotZ(n, tilt), c };
    },
  };
  return [soccer, basket, tennis, football];
}

/* ---------- 03 — wheel loader ---------- */

function loaderParts(): Part[] {
  const YEL = hex(0xf3b52c);
  const YEL_EDGE = hex(0xa8700f);
  const TIRE = hex(0x20252b);
  const TREAD = hex(0x0f1216);
  const RIM = hex(0xe8a720);
  const STEEL = hex(0x8a959e);
  const GLASS = hex(0x9cc7d8);
  const FRAME = hex(0x1d2328);
  const body = (edgeW = 0.045) => (_l: V3, edge: number) => (edge < edgeW ? YEL_EDGE : YEL);
  const parts: Part[] = [];

  // tyres
  for (const x of [-1.15, 0.78]) for (const z of [-0.66, 0.66]) {
    parts.push(cylinder([x, -0.55, z], 2, 0.52, 0.36, (local, onCap, rad) => {
      if (!onCap) {
        const a = Math.atan2(local[1], local[0]);
        return Math.abs(Math.sin(a * 11 + local[2] * 9)) > 0.72 ? TREAD : TIRE;
      }
      if (rad < 0.26) return rad < 0.08 ? FRAME : RIM;
      return rad < 0.3 ? FRAME : TIRE;
    }, { density: 1.15 }));
  }
  // rear chassis, engine hood, counterweight
  parts.push(box([-1.05, -0.12, 0], [1.55, 0.5, 0.92], body()));
  parts.push(box([-1.35, 0.3, 0], [0.95, 0.36, 0.84], (l, edge, face) => {
    if (face === 0 && Math.abs(Math.sin(l[1] * 55)) > 0.5) return FRAME; // grille
    return edge < 0.04 ? YEL_EDGE : YEL;
  }));
  parts.push(box([-1.9, -0.12, 0], [0.18, 0.62, 1.0], (_l, edge) => (edge < 0.05 ? FRAME : hex(0xcf9420))));
  // exhaust stack
  parts.push(tube([-1.55, 0.48, 0.28], [-1.55, 0.88, 0.28], 0.05, FRAME, { density: 1.6 }));
  // front frame
  parts.push(box([0.5, -0.24, 0], [1.05, 0.38, 0.72], body()));
  // cab: glass box with dark frame and yellow roof
  parts.push(box([-0.22, 0.62, 0], [0.86, 0.95, 0.9], (_l, edge, face) => {
    if (face === 2) return null; // floor hidden
    if (face === 3) return YEL; // roof
    return edge < 0.06 ? FRAME : GLASS;
  }, { density: 1.15 }));
  parts.push(box([-0.22, 1.13, 0], [1.0, 0.07, 1.02], body(0.03)));
  // lift arms + hydraulic rams
  for (const z of [-0.4, 0.4]) {
    parts.push(tube([0.05, 0.25, z], [1.6, -0.2, z], 0.1, YEL, { density: 1.3 }));
    parts.push(tube([0.35, -0.22, z * 0.6], [1.15, 0.1, z * 0.6], 0.06, STEEL, { density: 1.4 }));
  }
  // bucket: curved scoop surface + side plates + steel cutting edge
  const p0: [number, number] = [1.68, 0.48], p1: [number, number] = [1.38, -1.05], p2: [number, number] = [2.42, -0.86];
  const curve = (t: number): [number, number] => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];
  const W = 0.82;
  parts.push({
    area: 1.7 * W * 2,
    density: 1.9,
    sample: (r) => {
      const t = r();
      const [x, y] = curve(t);
      const [x2, y2] = curve(Math.min(1, t + 0.01));
      const n = norm([-(y2 - y), x2 - x, 0]);
      const z = (r() - 0.5) * W * 2;
      return { p: [x, y, z], n: mul(n, -1), c: Math.abs(Math.abs(z) - W) < 0.04 ? YEL_EDGE : YEL };
    },
  });
  parts.push({
    area: 0.9,
    density: 1.6,
    sample: (r) => {
      const t = r();
      const [cx, cy] = curve(t);
      const chord: [number, number] = [p0[0] + (p2[0] - p0[0]) * t, p0[1] + (p2[1] - p0[1]) * t];
      const k = r();
      const s = r() < 0.5 ? -1 : 1;
      return { p: [cx + (chord[0] - cx) * k, cy + (chord[1] - cy) * k, s * W], n: [0, 0, s], c: k > 0.92 ? YEL_EDGE : YEL };
    },
  });
  parts.push(tube([p2[0], p2[1], -W], [p2[0], p2[1], W], 0.045, STEEL, { density: 2.2 }));
  return parts;
}

/* ---------- 04 — vault ---------- */

const VAULT_HINGE: [number, number] = [-1.16, 0.34];
const DOOR_R = 1.06;

function vaultParts(): Part[] {
  const BODY = hex(0x66747f);
  const BODY_EDGE = hex(0x262f37);
  const DOOR = hex(0x8e9aa3);
  const DOOR_GROOVE = hex(0x48535c);
  const INNER = hex(0x141a20);
  const BAR = hex(0xf2c25a);
  const parts: Part[] = [];

  // body with a circular opening in the front face
  parts.push(box([0, 0, -0.45], [2.7, 2.9, 1.3], (l, edge, face) => {
    if (face === 5 && Math.hypot(l[0], l[1]) < DOOR_R + 0.06) return null;
    if (edge < 0.07) return BODY_EDGE;
    if (face === 5 && Math.hypot(l[0], l[1]) < DOOR_R + 0.16) return BODY_EDGE;
    return BODY;
  }));
  // cavity wall + back
  parts.push(cylinder([0, 0, -0.45], 2, DOOR_R + 0.05, 1.28, (_l, onCap) => (onCap ? INNER : hex(0x222b33)), { caps: false, density: 0.7 }));
  parts.push(cylinder([0, 0, -1.08], 2, DOOR_R + 0.05, 0.001, () => INNER, { density: 0.6 }));
  // stacked gold bars inside
  const bars: V3[] = [[-0.5, -0.72, -0.5], [0, -0.72, -0.5], [0.5, -0.72, -0.5], [-0.25, -0.55, -0.5], [0.25, -0.55, -0.5], [0, -0.38, -0.5]];
  for (const c of bars) parts.push(box(c, [0.44, 0.15, 0.6], (_l, edge) => (edge < 0.025 ? GOLD_DEEP : BAR), { density: 2 }));
  // frame ring
  parts.push(torus([0, 0, 0.22], DOOR_R + 0.1, 0.06, () => GOLD, { density: 1.6 }));
  // hinges
  for (const y of [-0.62, 0.62]) parts.push(cylinder([VAULT_HINGE[0], y, VAULT_HINGE[1]], 1, 0.085, 0.42, () => GOLD_DEEP, { density: 2 }));

  // door (part 1)
  parts.push(cylinder([0, 0, 0.36], 2, DOOR_R, 0.26, (local, onCap, rad) => {
    if (!onCap) return hex(0x6c7882);
    if (local[2] < 0) return hex(0x3a444c);
    const ring = rad % 0.22;
    return ring < 0.02 || rad > DOOR_R - 0.05 ? DOOR_GROOVE : DOOR;
  }, { part: 1, density: 1.1 }));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    parts.push(sphere([Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.5], 0.055, () => GOLD, { part: 1, density: 3 }));
  }
  // handle (part 2): hub, six spokes, knobs
  parts.push(cylinder([0, 0, 0.6], 2, 0.15, 0.2, () => GOLD, { part: 2, density: 2.2 }));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    const end: V3 = [Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.66];
    parts.push(tube([Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.66], end, 0.035, GOLD, { part: 2, density: 3 }));
    parts.push(sphere(end, 0.065, () => GOLD_DEEP, { part: 2, density: 3 }));
  }
  return parts;
}

/* ---------- assembly ---------- */

export function createMorphTargets(count: number): MorphSet {
  const dustCount = Math.round(count * 0.05);
  const solid = count - dustCount;
  const order = rng(7);

  const built: Record<FormName, Built> = {
    origin: build(solid, originParts(), 11, { shade: 0.55 }),
    sports: build(solid, sportsParts(), 23, { fit: 1.95 }),
    loader: build(solid, loaderParts(), 37, { fit: 2.1 }),
    vault: build(solid, vaultParts(), 53, { fit: 1.95 }),
  };

  const parts = new Float32Array(count);
  const result = { parts } as MorphSet;
  (Object.keys(built) as FormName[]).forEach((name, formIndex) => {
    const b = built[name];
    const idx = orderedIndices(b.pos, order);
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    idx.forEach((src, dst) => {
      positions.set(b.pos[src], dst * 3);
      colors.set(b.col[src], dst * 3);
      if (name === "vault") parts[dst] = b.part[src];
    });
    // ambient dust: same index range in every form, drifting shell around the subject
    const dr = rng(101 + formIndex);
    const dust: V3[] = Array.from({ length: dustCount }, () => mul(unitDir(dr), 2.4 + dr() * 1.3));
    orderedIndices(dust, dr).forEach((src, k) => {
      const dst = solid + k;
      positions.set(dust[src], dst * 3);
      colors.set(mix3(GOLD, CREAM, dr()), dst * 3);
      parts[dst] = PART_DUST;
    });
    result[name] = { positions, colors };
  });

  const v = built.vault;
  result.vaultHinge = [(VAULT_HINGE[0] - v.center[0]) * v.scale, (VAULT_HINGE[1] - v.center[2]) * v.scale];
  result.vaultHub = [(0 - v.center[0]) * v.scale, (0 - v.center[1]) * v.scale];
  return result;
}
