import * as THREE from "three";

/**
 * Momentum case-study stage: a glass of water in front of the Momentum logo,
 * real sachet artwork floating around it, and a scroll-driven pour where the
 * Pink Lemonade sachet tips its powder into the glass and the water turns pink.
 *
 * The stage never fades: every object materialises out of the particle system
 * (and dissolves back into it) through the same noise dissolve the other solid
 * forms use. `sampleMomentumPoints` gives the particles their targets on each
 * object, and `targets` exposes the objects so the scene can track them.
 *
 * Everything is a pure function of (reveal, progress, time), so it plays
 * identically forwards and backwards.
 */

const Y0 = -1.15;          // glass bottom
const H = 2.3;             // glass height
const Y1 = Y0 + H;         // glass rim
const R_BOT = 0.64;
const R_TOP = 0.86;
const WATER_Y = Y0 + H * 0.66;
const BASE_Y = Y0 + 0.16;  // top of the thick glass base
const radiusAt = (y: number) => R_BOT + (R_TOP - R_BOT) * ((y - Y0) / H);

const LOGO_W = 6.4;
const LOGO_H = 6.4 * (665 / 2048);
const LOGO_POS: [number, number, number] = [0, 0.85, -2.4];
const SACHET_W = 2.0;
const SACHET_H = 2.0 * (370 / 1400);

type Triple = [number, number, number];
const SACHETS: { file: string; base: Triple; rot: Triple; dark: number; light: number; pourer?: boolean }[] = [
  { file: "kl", base: [-2.5, 1.45, -0.6], rot: [0.15, 0.35, 0.42], dark: 0x2c6e3d, light: 0x9fd0ae },
  { file: "br", base: [2.85, -0.45, -0.4], rot: [-0.15, -0.4, -0.32], dark: 0x1f5f7d, light: 0x9bd3e2 },
  { file: "wp", base: [1.35, -1.85, 0.7], rot: [0.1, 0.45, 0.2], dark: 0xe5776b, light: 0xf1b9a6 },
  { file: "pl", base: [2.3, 1.25, 0.45], rot: [0.1, -0.3, 0.38], dark: 0xb94a7f, light: 0xf0b8d0, pourer: true },
];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => { const t = clamp(v); return t * t * (3 - 2 * t); };
const rgb = (h: number): Triple => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
const sachetPillow = (x: number, y: number) => 0.07 * (1 - (y / (SACHET_H / 2)) ** 2) * (1 - Math.pow(Math.abs(x / (SACHET_W / 2)), 8));

/**
 * Particle targets on every Momentum object, in each object's own space.
 * part: 0 glass + water (stage space), 1 logo, 2.. sachets (in SACHETS order).
 * Sorted along the axis the other forms use so the vault streams in coherently.
 */
export function sampleMomentumPoints(count: number) {
  let seed = 977;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const glassWhite: Triple = [0.9, 0.95, 1.0];
  const water: Triple = [0.62, 0.8, 0.96];
  const cream = rgb(0xf8f0d4);
  const panel = rgb(0x8aa6d3);
  type Pt = { p: Triple; part: number; c: Triple; key: number };
  const pts: Pt[] = [];
  const key = (p: Triple) => p[0] * 0.78 + p[1] * 0.5 + p[2] * 0.36;

  for (let i = 0; i < count; i++) {
    const u = rand();
    if (u < 0.55) {
      // glass wall, rim, base and the water inside
      const v = rand();
      const a = rand() * Math.PI * 2;
      let y: number, r: number;
      if (v < 0.6) { y = Y0 + rand() * H; r = radiusAt(y); }
      else if (v < 0.68) { y = Y1; r = R_TOP - rand() * 0.035; }
      else if (v < 0.76) { y = Y0 + rand() * 0.16; r = Math.sqrt(rand()) * (R_BOT - 0.02); }
      else { y = WATER_Y; r = Math.sqrt(rand()) * (radiusAt(WATER_Y) - 0.045); }
      const p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r];
      pts.push({ p, part: 0, c: y <= WATER_Y + 0.001 ? water : glassWhite, key: key(p) });
    } else if (u < 0.75) {
      // logo panel with a band of cream "lettering"
      const x = (rand() - 0.5) * LOGO_W * 0.98;
      const y = (rand() - 0.5) * LOGO_H * 0.96;
      const letters = Math.abs(y) < LOGO_H * 0.17 && Math.abs(x) < LOGO_W * 0.4 && Math.sin(x * 9.0) > -0.35;
      const p: Triple = [x, y, 0];
      pts.push({ p, part: 1, c: letters ? cream : panel, key: key([x + LOGO_POS[0], y + LOGO_POS[1], LOGO_POS[2]]) });
    } else {
      // sachets: dark flavour colour, lighter fruit end, cream wordmark band
      const k = Math.min(SACHETS.length - 1, Math.floor(((u - 0.75) / 0.25) * SACHETS.length));
      const s = SACHETS[k];
      const x = (rand() - 0.5) * SACHET_W * 0.96;
      const y = (rand() - 0.5) * SACHET_H * 0.86;
      const lightEnd = x > SACHET_W * 0.14;
      const word = !lightEnd && Math.abs(y) < 0.05 && x > -0.55 && x < 0.2;
      const p: Triple = [x, y, sachetPillow(x, y)];
      pts.push({ p, part: 2 + k, c: word ? cream : rgb(lightEnd ? s.light : s.dark), key: key([x + s.base[0], y + s.base[1], s.base[2]]) });
    }
  }
  pts.sort((a, b) => a.key - b.key);
  const pos = new Float32Array(count * 3);
  const part = new Float32Array(count);
  const col = new Float32Array(count * 3);
  pts.forEach((q, i) => { pos.set(q.p, i * 3); part[i] = q.part; col.set(q.c, i * 3); });
  return { pos, part, col };
}

/* ------------------------------------------------------------------ */
/* Dissolve (object-space noise, glowing edge) shared by every object   */
/* ------------------------------------------------------------------ */

const DISSOLVE_GLSL = /* glsl */ `
  uniform float uReveal;
  uniform vec3 uGlow;
  varying vec3 vDissolvePos;
  float dHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float dNoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dHash(i), dHash(i + vec3(1, 0, 0)), f.x), mix(dHash(i + vec3(0, 1, 0)), dHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(dHash(i + vec3(0, 0, 1)), dHash(i + vec3(1, 0, 1)), f.x), mix(dHash(i + vec3(0, 1, 1)), dHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
  // returns the edge distance; discards fragments not yet revealed
  float dissolve() {
    float n = dNoise(vDissolvePos * 2.4) * 0.65 + dNoise(vDissolvePos * 7.5) * 0.35;
    float e = uReveal * 1.12 - n;
    if (e < 0.0) discard;
    return e;
  }
  vec3 dissolveGlow(float e) { return uGlow * (1.0 - smoothstep(0.0, 0.07, e)) * (1.0 - step(0.999, uReveal)) * 2.2; }
`;

type Reveal = { value: number };

/** Adds the dissolve to a built-in material (logo, sachets, rim). */
function dissolveBasic<T extends THREE.Material>(mat: T, reveal: Reveal, glow: THREE.Color): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = reveal;
    shader.uniforms.uGlow = { value: glow };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDissolvePos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvDissolvePos = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${DISSOLVE_GLSL}`)
      .replace("void main() {", "void main() {\n  float dEdge = dissolve();")
      .replace("#include <opaque_fragment>", "outgoingLight += dissolveGlow(dEdge);\n#include <opaque_fragment>");
  };
  mat.customProgramCacheKey = () => "gp-dissolve-local";
  return mat;
}

const glassVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vDissolvePos;
  void main() {
    vDissolvePos = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const glassFragment = /* glsl */ `
  ${DISSOLVE_GLSL}
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float dEdge = dissolve();
    vec3 n = normalize(vN);
    float f = pow(1.0 - abs(dot(n, normalize(vV))), 2.2);
    // two soft vertical highlights, like light catching a tumbler
    float streak = smoothstep(0.5, 0.6, n.x) * (1.0 - smoothstep(0.66, 0.78, n.x)) * 0.5
                 + smoothstep(0.82, 0.9, -n.x) * 0.22;
    vec3 col = mix(vec3(0.82, 0.9, 1.0), vec3(1.0), clamp(f * 0.6 + streak, 0.0, 1.0)) + dissolveGlow(dEdge);
    gl_FragColor = vec4(col, 0.13 + 0.5 * f + streak + (1.0 - smoothstep(0.0, 0.07, dEdge)) * (1.0 - step(0.999, uReveal)));
  }
`;

const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform float uRipple;
  uniform float uTopY;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vPos;
  varying float vTop;
  varying vec3 vDissolvePos;
  void main() {
    vec3 p = position;
    vDissolvePos = position;
    vTop = step(uTopY - 0.001, p.y) * step(0.5, normal.y);
    float r = length(p.xz);
    // rings spreading from where the powder lands
    p.y += vTop * sin(r * 16.0 - uTime * 5.0) * 0.022 * uRipple * (1.0 - r);
    p.y += vTop * sin(p.x * 3.0 + uTime * 1.2) * 0.01;
    vPos = p;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const waterFragment = /* glsl */ `
  ${DISSOLVE_GLSL}
  uniform vec3 uColor;
  uniform vec3 uCloudColor;
  uniform float uCloud;
  uniform float uTime;
  uniform float uBottom;
  uniform float uTopY;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vPos;
  varying float vTop;
  void main() {
    float dEdge = dissolve();
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.0);
    float depth = clamp((vPos.y - uBottom) / (uTopY - uBottom), 0.0, 1.0);
    vec3 col = uColor * (0.72 + 0.38 * depth);
    // dissolving powder swirls through the water while it changes colour
    float swirl = 0.5 + 0.5 * sin(vPos.y * 9.0 + atan(vPos.z, vPos.x) * 3.0 - uTime * 1.6);
    swirl *= 0.5 + 0.5 * sin(vPos.y * 4.0 - atan(vPos.z, vPos.x) * 2.0 + uTime * 0.9);
    col = mix(col, uCloudColor, uCloud * swirl * 0.55);
    col = mix(col, vec3(1.0), vTop * 0.22 + f * 0.25) + dissolveGlow(dEdge);
    gl_FragColor = vec4(col, 0.84 + 0.14 * f + vTop * 0.02);
  }
`;

const powderVertex = /* glsl */ `
  attribute vec3 aSeed;
  uniform vec3 uTip;
  uniform float uSurface;
  uniform float uAmount;
  uniform float uTime;
  uniform float uScale;
  varying float vAlpha;
  void main() {
    float ph = fract(uTime * 0.7 + aSeed.x);
    vec3 start = uTip + (aSeed - 0.5) * 0.05;
    vec3 end = vec3((aSeed.y - 0.5) * 0.32, uSurface, (aSeed.z - 0.5) * 0.32);
    vec3 p;
    p.xz = mix(start.xz, end.xz, ph) + (aSeed.zy - 0.5) * ph * 0.18
         + vec2(sin(uTime * 3.0 + aSeed.x * 20.0), cos(uTime * 2.5 + aSeed.y * 20.0)) * 0.03 * ph;
    p.y = mix(start.y, end.y, ph * ph);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((0.022 + aSeed.y * 0.02) * uScale / -mv.z, 1.0, 7.0);
    float thin = smoothstep(aSeed.z, aSeed.z + 0.15, uAmount * 1.15); // exactly zero when the pour stops
    vAlpha = thin * smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.88, 1.0, ph));
  }
`;
const powderFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.15, r) * vAlpha * uOpacity;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0, 0.98, 0.95), a);
  }
`;

function glassGeometry() {
  const pts = [
    new THREE.Vector2(0.001, Y0),
    new THREE.Vector2(R_BOT - 0.03, Y0),
    new THREE.Vector2(R_BOT, Y0 + 0.04),
    new THREE.Vector2(R_TOP, Y1),
    new THREE.Vector2(R_TOP - 0.035, Y1),
    new THREE.Vector2(radiusAt(BASE_Y) - 0.04, BASE_Y),
    new THREE.Vector2(0.001, BASE_Y),
  ];
  return new THREE.LatheGeometry(pts, 72);
}

function waterGeometry() {
  const rTop = radiusAt(WATER_Y) - 0.045;
  const pts = [new THREE.Vector2(0.001, BASE_Y + 0.005), new THREE.Vector2(radiusAt(BASE_Y) - 0.045, BASE_Y + 0.005), new THREE.Vector2(rTop, WATER_Y)];
  // extra rings across the surface so it can ripple
  for (let k = 1; k <= 10; k++) pts.push(new THREE.Vector2(Math.max(0.001, rTop * (1 - k / 10)), WATER_Y));
  return new THREE.LatheGeometry(pts, 72);
}

function sachetGeometry() {
  const g = new THREE.PlaneGeometry(SACHET_W, SACHET_H, 32, 4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, sachetPillow(pos.getX(i), pos.getY(i)));
  g.computeVertexNormals();
  return g;
}

/**
 * A slice of the sachet between x0 and x1 (in sachet space), with the artwork mapped as on the
 * whole sachet. Used to split the pouring sachet into its body and the strip that tears off.
 * The slice is shifted by -origin so it can be hinged about that point.
 */
function sachetSlice(x0: number, x1: number, origin: [number, number] = [0, 0]) {
  const g = new THREE.PlaneGeometry(x1 - x0, SACHET_H, Math.max(2, Math.round(32 * (x1 - x0) / SACHET_W)), 4);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + (x0 + x1) / 2;
    const y = pos.getY(i);
    uv.setX(i, (x + SACHET_W / 2) / SACHET_W);
    pos.setXYZ(i, x - origin[0], y - origin[1], sachetPillow(x, y));
  }
  g.computeVertexNormals();
  return g;
}
const TEAR_X = SACHET_W / 2 - 0.17; // where the pouring sachet is torn open (its +x end comes off)

const WATER_CLEAR = new THREE.Color(0.74, 0.86, 0.96);
const WATER_PINK = new THREE.Color(0.93, 0.4, 0.6);

export function createMomentumStage(renderer: THREE.WebGLRenderer, opts: { mirror?: boolean } = {}) {
  const group = new THREE.Group();
  group.visible = false;
  const reveal: Reveal = { value: 0 };
  const glow = new THREE.Color(0xd6e6ff);
  const loader = new THREE.TextureLoader();
  const disposables: { dispose(): void }[] = [];
  const load = (url: string) => {
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    disposables.push(tex);
    return tex;
  };

  /* logo behind the glass */
  const logoMat = dissolveBasic(new THREE.MeshBasicMaterial({ map: load("/momentum/logo.png"), toneMapped: false, transparent: true, depthWrite: false }), reveal, glow);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(LOGO_W, LOGO_H), logoMat);
  logo.position.set(...LOGO_POS);
  logo.renderOrder = 3;
  group.add(logo);
  disposables.push(logoMat, logo.geometry);

  /* sachets — real packaging artwork */
  const sachetGeo = sachetGeometry();
  disposables.push(sachetGeo);
  // the pouring sachet is two pieces: its body and the end strip that tears off before the pour
  const bodyGeo = sachetSlice(-SACHET_W / 2, TEAR_X);
  const stripGeo = sachetSlice(TEAR_X, SACHET_W / 2, [TEAR_X, -SACHET_H / 2]); // hinged at one end of the cut
  disposables.push(bodyGeo, stripGeo);
  let strip: THREE.Mesh | null = null;
  let stripMat: THREE.MeshBasicMaterial | null = null;
  const sachets = SACHETS.map((d) => {
    const map = load(`/momentum/sachet-${d.file}.png`);
    const mat = dissolveBasic(new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide }), reveal, glow);
    disposables.push(mat);
    const mesh = new THREE.Mesh(d.pourer ? bodyGeo : sachetGeo, mat);
    if (d.pourer) {
      stripMat = dissolveBasic(new THREE.MeshBasicMaterial({ map, toneMapped: false, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide }), reveal, glow);
      disposables.push(stripMat);
      strip = new THREE.Mesh(stripGeo, stripMat);
      strip.renderOrder = 4;
      strip.position.set(TEAR_X, -SACHET_H / 2, 0);
      mesh.add(strip);
    }
    mesh.renderOrder = 4;
    group.add(mesh);
    // right-to-left layouts: the floating sachets swap sides so they keep clear of the copy (the pourer keeps its path)
    const flip = opts.mirror && !d.pourer ? -1 : 1;
    return { mesh, base: new THREE.Vector3(d.base[0] * flip, d.base[1], d.base[2]), rot: new THREE.Euler(d.rot[0], d.rot[1] * flip, d.rot[2] * flip), pourer: d.pourer };
  });

  /* water + glass */
  const waterUniforms = {
    uReveal: reveal,
    uGlow: { value: glow },
    uColor: { value: WATER_CLEAR.clone() },
    uCloudColor: { value: new THREE.Color(1, 0.86, 0.92) },
    uCloud: { value: 0 },
    uTime: { value: 0 },
    uRipple: { value: 0 },
    uTopY: { value: WATER_Y },
    uBottom: { value: BASE_Y },
  };
  const water = new THREE.Mesh(waterGeometry(), new THREE.ShaderMaterial({
    uniforms: waterUniforms, vertexShader: waterVertex, fragmentShader: waterFragment, transparent: true, depthWrite: false,
  }));
  water.renderOrder = 5;
  group.add(water);
  disposables.push(water.geometry, water.material as THREE.Material);

  const glass = new THREE.Mesh(glassGeometry(), new THREE.ShaderMaterial({
    uniforms: { uReveal: reveal, uGlow: { value: glow } }, vertexShader: glassVertex, fragmentShader: glassFragment,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  }));
  glass.renderOrder = 6;
  group.add(glass);
  disposables.push(glass.geometry, glass.material as THREE.Material);

  const rimMat = dissolveBasic(new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, opacity: 0.45, depthWrite: false }), reveal, glow);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R_TOP - 0.017, 0.016, 8, 96), rimMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = Y1;
  rim.renderOrder = 6;
  group.add(rim);
  disposables.push(rimMat, rim.geometry);

  /* powder stream */
  const powderCount = 900;
  const seeds = new Float32Array(powderCount * 3);
  for (let i = 0; i < powderCount; i++) {
    const h = (n: number) => { const v = Math.sin((i + 1) * 91.17 + n * 47.3) * 43758.5453; return v - Math.floor(v); };
    seeds.set([h(1), h(2), h(3)], i * 3);
  }
  const powderGeo = new THREE.BufferGeometry();
  powderGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(powderCount * 3), 3));
  powderGeo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 3));
  const powderUniforms = {
    uTip: { value: new THREE.Vector3() },
    uSurface: { value: WATER_Y },
    uAmount: { value: 0 },
    uTime: { value: 0 },
    uScale: { value: 500 },
    uOpacity: { value: 0 },
  };
  const powder = new THREE.Points(powderGeo, new THREE.ShaderMaterial({
    uniforms: powderUniforms, vertexShader: powderVertex, fragmentShader: powderFragment, transparent: true, depthWrite: false,
  }));
  powder.frustumCulled = false;
  powder.renderOrder = 7;
  group.add(powder);
  disposables.push(powderGeo, powder.material as THREE.Material);

  /* pour pose for the Pink Lemonade sachet: open (+x) end just above the rim */
  const pourDir = new THREE.Vector3(-0.42, -0.9, 0).normalize();
  const tipTarget = new THREE.Vector3(0.1, Y1 + 0.32, 0.05);
  const pourPos = tipTarget.clone().addScaledVector(pourDir, -1.0);
  const pourQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(pourDir.y, pourDir.x))
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.35));
  const floatQuat = new THREE.Quaternion();
  const shakeQuat = new THREE.Quaternion();
  const zAxis = new THREE.Vector3(0, 0, 1);
  const euler = new THREE.Euler();
  const tmpPos = new THREE.Vector3();
  const tipLocal = new THREE.Vector3(TEAR_X - 0.01, 0, 0); // the torn edge

  /**
   * reveal: 0 = only particles, 1 = fully solid. The scene owns the group's
   * position and scale (it is anchored to the camera). Object transforms are
   * updated even while hidden, because the particles use them as targets.
   */
  function update({ reveal: r, progress, time }: { reveal: number; progress: number; time: number }) {
    reveal.value = r;
    group.visible = r > 0.002;
    const mp = clamp(progress);

    // 0 → .22 sachet travels over the glass and tips; .22 → .36 its end is torn off; the powder
    // flows .36 → .6 while the water changes colour (.38 → .58); then the sachet drifts back (.75 → .93)
    const approach = smooth(mp / 0.22);
    const tear = smooth((mp - 0.22) / 0.14);
    const retreat = smooth((mp - 0.75) / 0.18);
    const toPour = approach * (1 - retreat);
    const pour = smooth((mp - 0.36) / 0.03) * (1 - smooth((mp - 0.6) / 0.04));
    const tint = smooth((mp - 0.38) / 0.2);
    const cloud = smooth((mp - 0.38) / 0.06) * (1 - smooth((mp - 0.56) / 0.2));

    // the tear: the strip peels open from one edge (hinged at the other end of the cut), then rips
    // free and flicks away up and out of the pour, fading as it goes
    if (strip && stripMat) {
      const st = strip as THREE.Mesh;
      const sm = stripMat as THREE.MeshBasicMaterial;
      const peel = smooth(tear / 0.55);
      const fly = smooth((tear - 0.5) / 0.5);
      st.position.set(TEAR_X + fly * 0.35, -SACHET_H / 2 - fly * 0.95, fly * 0.45);
      st.rotation.set(fly * 0.5, fly * 0.7, -peel * 0.5 - fly * 1.7);
      const fade = smooth((tear - 0.72) / 0.28);
      st.visible = fade < 0.995;
      sm.opacity = 1 - fade;
    }

    logo.position.y = LOGO_POS[1] + Math.sin(time * 0.4) * 0.04;

    sachets.forEach((s, i) => {
      tmpPos.set(s.base.x, s.base.y + Math.sin(time * 0.8 + i * 1.7) * 0.12, s.base.z);
      floatQuat.setFromEuler(euler.set(
        s.rot.x + Math.sin(time * 0.5 + i) * 0.12,
        s.rot.y + Math.sin(time * 0.4 + i * 2.1) * 0.25,
        s.rot.z + Math.sin(time * 0.6 + i * 1.3) * 0.08,
      ));
      if (s.pourer) {
        tmpPos.lerp(pourPos, toPour);
        s.mesh.quaternion.copy(floatQuat).slerp(pourQuat, toPour)
          .multiply(shakeQuat.setFromAxisAngle(zAxis, Math.sin(time * 28) * 0.02 * pour)); // a little shake while it pours
      } else {
        tmpPos.z -= toPour * 0.6; // the others drift back to give the pour the stage
        s.mesh.quaternion.copy(floatQuat);
      }
      s.mesh.position.copy(tmpPos);
    });

    const pourer = sachets.find((s) => s.pourer)!;
    pourer.mesh.updateMatrix();
    powderUniforms.uTip.value.copy(tipLocal).applyMatrix4(pourer.mesh.matrix);
    powderUniforms.uAmount.value = pour;
    powderUniforms.uTime.value = time;
    powderUniforms.uOpacity.value = r;

    waterUniforms.uColor.value.copy(WATER_CLEAR).lerp(WATER_PINK, tint);
    waterUniforms.uCloud.value = cloud;
    waterUniforms.uRipple.value = Math.max(pour, cloud * 0.4);
    waterUniforms.uTime.value = time;
  }

  return {
    group,
    /** Objects the particle targets are expressed in: [glass (stage space), logo, ...sachets]. */
    targets: [group, logo, ...sachets.map((s) => s.mesh)] as THREE.Object3D[],
    setPointScale(v: number) { powderUniforms.uScale.value = v; },
    update,
    dispose() { disposables.forEach((d) => d.dispose()); },
  };
}
