"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createMorphTargets, type FormName } from "@/lib/morph-shapes";

const FORMS: FormName[] = ["origin", "sports", "loader", "vault"];
/** Sections that drive the morph (first four) and the background palette (all). */
const SECTION_IDS = ["home", "about", "ventures", "advisory", "process", "apply"];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Per-form framing. `x` is a fraction of the visible half-width (0 = centre,
 * positive = right). Portrait screens always centre the object.
 */
const POSE = [
  { rx: 0.12, ry: 0.0, x: 0, scale: 1.0 },
  { rx: 0.1, ry: -0.28, x: 0.44, scale: 0.92 },
  { rx: 0.2, ry: -0.62, x: 0, scale: 1.0 },
  { rx: 0.08, ry: 0.36, x: 0.42, scale: 1.14 },
];

/** Void palette per section: gradient top, gradient bottom, light-beam colour. */
const PALETTES: [number, number, number][] = [
  [0x10263b, 0x05090f, 0xf2c27c], // home — midnight, warm gold light
  [0x0f2c42, 0x050d16, 0x8ccfff], // about — deep ocean, cool light
  [0x2b1a0b, 0x0b0704, 0xffb44a], // ventures — umber, amber light
  [0x121d33, 0x05070d, 0xffd27a], // advisory — ink blue, gold light
  [0x22163a, 0x08060f, 0xc4a2ff], // process — violet void
  [0x3d150b, 0x100503, 0xff8a5a], // apply — ember
];

/* ------------------------------------------------------------------ */
/* Background: coloured void + a distinct set of light rays per section */
/* ------------------------------------------------------------------ */

const backgroundVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const backgroundFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uTop;
  uniform vec3 uBottom;
  uniform vec3 uBeam;
  uniform vec2 uFocus;
  uniform float uFocusAmount;
  uniform float uAspect;
  uniform float uTime;
  uniform float uScroll;
  uniform float uTone;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float h1(float n) { return fract(sin(n * 127.1 + 0.3) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  // A soft volumetric shaft entering from above the frame; 'reach' is how far down it has struck.
  float beam(vec2 p, vec2 origin, float angle, float width, float seed, float reach) {
    vec2 d = vec2(sin(angle), -cos(angle));
    vec2 rel = p - origin;
    float along = dot(rel, d);
    float across = dot(rel, vec2(-d.y, d.x));
    float w = width * (1.0 + along * 0.55);
    float shaft = exp(-(across * across) / (w * w));
    float core = exp(-(across * across) / (w * w * 0.08)) * 0.35;
    float falloff = smoothstep(-0.05, 0.3, along) * exp(-max(along, 0.0) * 0.4);
    float strike = 1.0 - smoothstep(reach - 0.45, reach, along);
    float dust = 0.55 + 0.45 * fbm(vec2(across * 7.0 + seed, along * 1.6 - uTime * 0.07 + uScroll * 0.6));
    float flicker = 0.8 + 0.2 * sin(uTime * (0.35 + h1(seed) * 0.3) + seed * 4.0);
    return (shaft + core) * falloff * strike * dust * flicker;
  }

  // Each section owns four rays with their own origins, angles and widths.
  float beamSet(vec2 p, float k, float w) {
    if (w < 0.002) return 0.0;
    float reach = mix(0.0, 2.8, smoothstep(0.0, 0.85, w));
    float total = 0.0;
    for (int j = 0; j < 4; j++) {
      float s = k * 11.0 + float(j) * 3.7 + 1.0;
      vec2 origin = vec2((h1(s) - 0.5) * 1.7 * uAspect, 0.6 + h1(s + 1.0) * 0.3);
      float angle = (h1(s + 2.0) - 0.5) * 1.1 + sin(uTime * 0.05 + s) * 0.04;
      float width = 0.022 + h1(s + 3.0) * 0.06;
      float intensity = 0.55 + h1(s + 4.0) * 0.6;
      total += beam(p, origin, angle, width, s, reach + h1(s + 5.0) * 0.4) * intensity;
    }
    return total * smoothstep(0.0, 0.5, w);
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);

    float g = smoothstep(-0.65, 0.75, p.y + p.x * 0.18);
    vec3 col = mix(uBottom, uTop, g);
    float haze = fbm(p * 1.6 + vec2(uTime * 0.015, -uScroll * 0.35));
    col += uTop * (haze - 0.5) * 0.45;

    // old rays retract while the next section's rays strike in
    float k0 = floor(uTone);
    float f = uTone - k0;
    float b = beamSet(p, k0, 1.0 - f) + beamSet(p, k0 + 1.0, f);
    col += uBeam * b * 0.4;
    col += uBeam * b * b * 0.12;

    vec2 fp = p - uFocus * vec2(uAspect * 0.5, 0.5);
    col += uBeam * exp(-dot(fp, fp) / 0.16) * 0.1 * uFocusAmount;

    col *= 1.0 - 0.5 * dot(p * vec2(0.75, 1.0), p * vec2(0.75, 1.0));
    col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) / 255.0 * 2.0;
    gl_FragColor = vec4(max(col, 0.0), 1.0);
  }
`;

/* ------------------------------------------------------------------ */
/* Ambient drifting specks covering the whole screen                    */
/* ------------------------------------------------------------------ */

const ambientVertex = /* glsl */ `
  attribute vec2 aSeed;
  uniform float uTime;
  uniform float uScroll;
  uniform float uScale;
  uniform vec2 uHalf;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float span = uHalf.y * 2.6;
    p.y = mod(p.y + uScroll * (0.6 + aSeed.x * 0.8) + uTime * 0.04 * (0.5 + aSeed.y) + span * 0.5, span) - span * 0.5;
    p.x = p.x * uHalf.x * 1.15 + sin(uTime * 0.2 + aSeed.y * 30.0) * 0.08;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((0.016 + aSeed.x * 0.03) * uScale / -mv.z, 1.0, 5.0);
    vAlpha = (0.25 + 0.75 * aSeed.y) * (0.55 + 0.45 * sin(uTime * (0.6 + aSeed.x) + aSeed.y * 40.0));
  }
`;

const ambientFragment = /* glsl */ `
  uniform vec3 uBeam;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, r) * vAlpha * 0.4;
    if (a < 0.01) discard;
    gl_FragColor = vec4(mix(vec3(1.0), uBeam, 0.55), a);
  }
`;

/* ------------------------------------------------------------------ */
/* Morphing object                                                      */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aPos3;
  attribute vec3 aCol0;
  attribute vec3 aCol1;
  attribute vec3 aCol2;
  attribute vec3 aCol3;
  attribute vec2 aMeta;  // x: random seed, y: vault part / dust tag
  attribute vec4 aExtra; // xyz: ball centre (sports), w: lift-arm flag (loader)

  uniform float uStage;
  uniform float uTime;
  uniform float uIntro;
  uniform float uDisperse;
  uniform float uSpread;
  uniform float uDoor;
  uniform float uSpin;
  uniform float uSize;
  uniform float uScale;
  uniform float uHover;
  uniform float uIdle;
  uniform vec4 uLocal;   // x: stream energy, y: balls apart, z: arm lift
  uniform vec2 uPointer;
  uniform vec2 uHinge;
  uniform vec2 uHub;
  uniform vec2 uPivot;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  vec2 rot2(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
  vec3 hash3(float n) { return fract(sin(vec3(n, n + 1.7, n + 3.1) * vec3(43758.5453, 22578.1459, 19642.349))); }

  vec3 gStreamPos;
  vec3 gStreamCol;

  // 01 — fiber stream: a twisting ribbon of strands, energised by scroll.
  void stream(float r) {
    float x = position.x;
    float v = position.y;
    float E = uLocal.x;
    float t = uTime;
    float yc = 0.45 * sin(x * 0.62 + t * 0.32) + 0.14 * sin(x * 1.7 - t * 0.55);
    float h = (0.55 + 0.22 * sin(x * 0.5 + 1.3 + t * 0.12)) * (1.0 + E * 1.2);
    float tw = x * 0.8 + t * 0.35 + E * 2.2;
    float c = cos(tw), s = sin(tw);
    vec3 p = vec3(x * (1.0 + E * 0.3), yc * (1.0 + E * 0.8) + v * h * c, v * h * s * 1.15 + position.z);
    // scroll makes the strands vibrate harder
    float buzz = E * E;
    p.y += sin(x * 3.2 - t * (2.0 + E * 6.0) + v * 1.5) * 0.06 * (0.3 + E * 1.6);
    p += (hash3(r * 53.1) - 0.5) * buzz * 0.22 * sin(t * 24.0 + r * 140.0);
    gStreamPos = p;
    float crossing = pow(1.0 - abs(c), 3.0);
    vec3 base = mix(vec3(0.42, 0.5, 0.6), vec3(0.85, 0.85, 0.8), 0.5 + 0.5 * v * s);
    gStreamCol = mix(base, vec3(0.98, 0.78, 0.46), clamp(crossing * 0.95 + E * 0.25, 0.0, 1.0));
  }

  // 02 — balls drift apart and spin on their own axes.
  vec3 sportsPos() {
    vec3 c = aExtra.xyz;
    float u = uLocal.y;
    vec3 local = rotY(aPos1 - c, u * (1.6 + fract(length(c) * 3.7) * 1.4));
    return c * (1.0 + u * 0.85) + vec3(0.0, 0.0, u * 0.35) + local;
  }

  // 03 — lift arm and bucket raise around the arm pivot.
  vec3 loaderPos() {
    vec3 p = aPos2;
    if (aExtra.w > 0.5) p.xy = uPivot + rot2(p.xy - uPivot, uLocal.z * 0.95);
    return p;
  }

  // 04 — handle spins, then the door swings on its hinge.
  vec3 vaultPos() {
    vec3 p = aPos3;
    float part = aMeta.y;
    if (part > 1.5 && part < 2.5) p.xy = uHub + rot2(p.xy - uHub, uSpin);
    if (part > 0.5 && part < 2.5) {
      vec3 h = vec3(uHinge.x, p.y, uHinge.y);
      p = h + rotY(p - h, -uDoor);
    }
    return p;
  }

  vec3 posAt(float k) {
    if (k < 0.5) return gStreamPos;
    if (k < 1.5) return sportsPos();
    if (k < 2.5) return loaderPos();
    return vaultPos();
  }
  vec3 colAt(float k) {
    if (k < 0.5) return gStreamCol;
    if (k < 1.5) return aCol1;
    if (k < 2.5) return aCol2;
    return aCol3;
  }

  void main() {
    float r = aMeta.x;
    bool dust = aMeta.y > 2.5;
    if (dust) { gStreamPos = position * 1.4; gStreamCol = aCol0; } else stream(r);

    float st = clamp(uStage, 0.0, 3.0);
    float i = min(floor(st), 2.0);
    float f = st - i;
    vec3 A = posAt(i);
    vec3 B = posAt(i + 1.0);

    // staggered wave: particles on the left leave first, with a little randomness
    float sweep = clamp(0.5 + A.x * 0.12 + (r - 0.5) * 0.45, 0.0, 1.0);
    float e = clamp(f * 1.8 - sweep * 0.8, 0.0, 1.0);
    e = e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
    float arc = sin(3.14159265 * e);

    vec3 dir = normalize(hash3(r * 91.7) - 0.5 + 1e-4);
    vec3 p = mix(A, B, e);
    p += (dir * 0.55 + normalize(p + 1e-4) * 0.3) * arc * uSpread;
    p += vec3(sin(uTime * 1.3 + r * 40.0), cos(uTime * 1.1 + r * 31.0), sin(uTime * 0.9 + r * 17.0)) * (0.07 * arc + 0.006 * uIdle);

    float ie = clamp(uIntro * 1.5 - r * 0.5, 0.0, 1.0);
    ie = 1.0 - pow(1.0 - ie, 3.0);
    p = mix(dir * (3.2 + r * 2.4), p, ie);

    if (dust) p = rotY(p, uTime * 0.03 * uIdle);
    p += dir * uDisperse * (1.2 + r * 1.8);

    // smaller and fainter the further a particle is from the centre
    float fade = smoothstep(1.6, 4.6, length(p));

    vec4 world = modelMatrix * vec4(p, 1.0);
    vec2 d = world.xy - uPointer;
    float infl = uHover * exp(-dot(d, d) / 0.5);
    world.xy += normalize(d + 1e-4) * infl * 0.5;
    world.z += infl * 0.45;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    float size = uSize * (dust ? 0.7 : 1.0) * (0.85 + r * 0.3) * (1.0 + arc * 0.2) * (1.0 - 0.65 * fade);
    gl_PointSize = clamp(size * uScale / -mv.z, 0.8, 12.0);

    vColor = mix(colAt(i), colAt(i + 1.0), e) * (1.0 + infl * 0.35);
    vAlpha = (dust ? 0.35 : 1.0) * (1.0 - uDisperse) * ie * (1.0 - 0.92 * fade);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float edge = smoothstep(0.5, 0.36, r);
    if (edge < 0.35) discard;
    float a = edge * vAlpha * uOpacity;
    if (a < 0.015) discard;
    gl_FragColor = vec4(vColor * (1.0 - r * 0.45), a);
  }
`;

/**
 * Full-screen scene: a shader-drawn coloured void with light rays, an ambient
 * particle field, and one morphing particle object. Every motion is a pure
 * function of scroll position (smoothed), so it plays forwards and backwards.
 */
export function MorphingParticleScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = document.getElementById("gp-morph-track");
    if (!container || !track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return; // the CSS gradient on <body> remains as the fallback
    }

    const mobile = window.innerWidth < 700;
    const count = mobile ? 15000 : 30000;
    const targets = createMorphTargets(count);

    /* ---- morphing object ---- */
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(targets.origin.positions, 3));
    geometry.setAttribute("aPos1", new THREE.BufferAttribute(targets.sports.positions, 3));
    geometry.setAttribute("aPos2", new THREE.BufferAttribute(targets.loader.positions, 3));
    geometry.setAttribute("aPos3", new THREE.BufferAttribute(targets.vault.positions, 3));
    FORMS.forEach((form, k) => geometry.setAttribute(`aCol${k}`, new THREE.BufferAttribute(targets[form].colors, 3)));
    const meta = new Float32Array(count * 2);
    const extra = new Float32Array(count * 4);
    for (let i = 0; i < count; i++) {
      meta[i * 2] = ((i * 0.61803398875) % 1 + 1) % 1;
      meta[i * 2 + 1] = targets.parts[i];
      extra[i * 4] = targets.sportsCenters[i * 3];
      extra[i * 4 + 1] = targets.sportsCenters[i * 3 + 1];
      extra[i * 4 + 2] = targets.sportsCenters[i * 3 + 2];
      extra[i * 4 + 3] = targets.loaderArm[i];
    }
    geometry.setAttribute("aMeta", new THREE.BufferAttribute(meta, 2));
    geometry.setAttribute("aExtra", new THREE.BufferAttribute(extra, 4));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);

    const uniforms = {
      uStage: { value: 0 },
      uTime: { value: 0 },
      uIntro: { value: reducedMotion ? 1 : 0 },
      uDisperse: { value: 0 },
      uSpread: { value: 1 },
      uDoor: { value: 0 },
      uSpin: { value: 0 },
      uSize: { value: mobile ? 0.048 : 0.036 },
      uScale: { value: 500 },
      uHover: { value: 0 },
      uIdle: { value: reducedMotion ? 0 : 1 },
      uLocal: { value: new THREE.Vector4() },
      uPointer: { value: new THREE.Vector2(99, 99) },
      uHinge: { value: new THREE.Vector2(...targets.vaultHinge) },
      uHub: { value: new THREE.Vector2(...targets.vaultHub) },
      uPivot: { value: new THREE.Vector2(...targets.loaderPivot) },
      uOpacity: { value: 1 },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: true, depthTest: true });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    points.renderOrder = 2;
    const model = new THREE.Group();
    model.add(points);

    /* ---- void background ---- */
    const palette = PALETTES.map((p) => p.map((c) => new THREE.Color(c)));
    const bgUniforms = {
      uTop: { value: palette[0][0].clone() },
      uBottom: { value: palette[0][1].clone() },
      uBeam: { value: palette[0][2].clone() },
      uFocus: { value: new THREE.Vector2() },
      uFocusAmount: { value: 1 },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uTone: { value: 0 },
    };
    const background = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ uniforms: bgUniforms, vertexShader: backgroundVertex, fragmentShader: backgroundFragment, depthTest: false, depthWrite: false }),
    );
    background.frustumCulled = false;
    background.renderOrder = -1;

    /* ---- ambient particle field ---- */
    const ambientCount = mobile ? 500 : 1100;
    const ambientPos = new Float32Array(ambientCount * 3);
    const ambientSeed = new Float32Array(ambientCount * 2);
    for (let i = 0; i < ambientCount; i++) {
      const h = (n: number) => { const v = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453; return v - Math.floor(v); };
      ambientPos.set([h(1) * 2 - 1, (h(2) - 0.5) * 12, -5 + h(3) * 6], i * 3);
      ambientSeed.set([h(4), h(5)], i * 2);
    }
    const ambientGeometry = new THREE.BufferGeometry();
    ambientGeometry.setAttribute("position", new THREE.BufferAttribute(ambientPos, 3));
    ambientGeometry.setAttribute("aSeed", new THREE.BufferAttribute(ambientSeed, 2));
    const ambientUniforms = {
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uScale: uniforms.uScale,
      uHalf: { value: new THREE.Vector2(6, 3.3) },
      uBeam: bgUniforms.uBeam,
    };
    const ambient = new THREE.Points(ambientGeometry, new THREE.ShaderMaterial({
      uniforms: ambientUniforms, vertexShader: ambientVertex, fragmentShader: ambientFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    ambient.frustumCulled = false;
    ambient.renderOrder = 1;

    const scene = new THREE.Scene();
    scene.add(background, ambient, model);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "gp-morph-canvas";
    container.prepend(renderer.domElement);

    /* ---- layout ---- */
    let anchors = SECTION_IDS.map(() => 0);
    let trackEnd = 1;
    let viewH = window.innerHeight;
    let halfW = 6, halfH = 3.3, camDist = 10;
    let portrait = false;
    const drawSize = new THREE.Vector2();

    function resize() {
      const width = Math.max(1, window.innerWidth);
      const height = Math.max(1, window.innerHeight);
      viewH = height;
      portrait = width / height < 0.9;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      // landscape: the object fills ~68% of the half-height; portrait: sized by width
      halfH = portrait ? 2.25 / 0.86 / camera.aspect : 2.25 / 0.68;
      halfW = halfH * camera.aspect;
      camDist = halfH / Math.tan(vfov / 2);
      camera.updateProjectionMatrix();
      renderer.getDrawingBufferSize(drawSize);
      uniforms.uScale.value = drawSize.y / (2 * Math.tan(vfov / 2));
      bgUniforms.uAspect.value = camera.aspect;
      ambientUniforms.uHalf.value.set(halfW, halfH);
      anchors = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      });
      trackEnd = track!.getBoundingClientRect().bottom + window.scrollY;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(track);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", resize, { passive: true });

    /* ---- scroll → continuous targets ---- */
    const span = (y: number, from: number, to: number) => clamp((y - from) / Math.max(1, to - from));
    function readScroll() {
      const y = window.scrollY;
      const vh = viewH;
      const A = anchors;
      // morph k-1 → k while section k rises from 75% to 25% of the viewport
      let stage = 0;
      for (let k = 1; k < 4; k++) stage += span(y, A[k] - vh * 0.75, A[k] - vh * 0.25);
      // per-form motion, active for the whole time each form is on screen
      const local0 = span(y, 0, A[1] - vh * 0.45);                  // stream energises
      const local1 = span(y, A[1] - vh * 0.3, A[2] - vh * 0.6);     // balls drift apart
      const local2 = span(y, A[2] - vh * 0.3, A[3] - vh * 0.6);     // arm lifts, camera pans
      const local3 = span(y, A[3] - vh * 0.3, trackEnd - vh * 0.6); // vault unlocks and opens
      let tone = 0;
      for (let k = 1; k < SECTION_IDS.length; k++) tone += span(y, A[k] - vh * 0.75, A[k] - vh * 0.05);
      const visible = clamp((trackEnd - y - vh * 0.05) / (vh * 0.45));
      return { stage, local0, local1, local2, local3, tone, visible, y };
    }

    /* ---- pointer ---- */
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    const ndc = new THREE.Vector2();
    let pointerInside = false;
    let parallaxX = 0, parallaxY = 0, targetParX = 0, targetParY = 0;
    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion || event.pointerType === "touch") return;
      const nx = event.clientX / window.innerWidth;
      const ny = event.clientY / window.innerHeight;
      targetParX = nx - 0.5;
      targetParY = ny - 0.5;
      pointerInside = true;
      ndc.set(nx * 2 - 1, -(ny * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) uniforms.uPointer.value.set(hit.x, hit.y);
    };
    const onPointerLeave = () => { pointerInside = false; targetParX = targetParY = 0; };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    /* ---- loop ---- */
    const initial = readScroll();
    const state = { ...initial, hover: 0, scroll: initial.y };
    let raf = 0;
    let last = performance.now();
    const start = last;
    const focus = new THREE.Vector3();

    function applyPalette(tone: number) {
      const t = clamp(tone, 0, PALETTES.length - 1);
      const i = Math.min(PALETTES.length - 2, Math.floor(t));
      const f = smooth(t - i);
      bgUniforms.uTop.value.copy(palette[i][0]).lerp(palette[i + 1][0], f);
      bgUniforms.uBottom.value.copy(palette[i][1]).lerp(palette[i + 1][1], f);
      bgUniforms.uBeam.value.copy(palette[i][2]).lerp(palette[i + 1][2], f);
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const target = readScroll();

      if (reducedMotion) {
        Object.assign(state, target);
        state.stage = Math.round(target.stage);
        state.scroll = target.y;
      } else {
        const gap = Math.abs(target.stage - state.stage);
        state.stage = damp(state.stage, target.stage, 4.2, dt);
        state.local0 = damp(state.local0, target.local0, 5, dt);
        state.local1 = damp(state.local1, target.local1, 5, dt);
        state.local2 = damp(state.local2, target.local2, 5, dt);
        state.local3 = damp(state.local3, target.local3, 5, dt);
        state.tone = damp(state.tone, target.tone, 3, dt);
        state.visible = damp(state.visible, target.visible, 6, dt);
        state.scroll = damp(state.scroll, target.y, 5, dt);
        state.hover = damp(state.hover, pointerInside ? 1 : 0, 5, dt);
        uniforms.uSpread.value = damp(uniforms.uSpread.value, 1 + Math.min(gap * 0.9, 0.9), 3, dt);
        uniforms.uIntro.value = clamp(t / 2.6);
        parallaxX = damp(parallaxX, targetParX, 2.5, dt);
        parallaxY = damp(parallaxY, targetParY, 2.5, dt);
      }

      const idle = reducedMotion ? 0 : 1;
      const s = clamp(state.stage, 0, 3);
      const i = Math.min(2, Math.floor(s));
      const f = s - i;
      const eased = smooth(clamp((f - 0.1) / 0.8));
      const a = POSE[i], b = POSE[i + 1];
      // how present each form is right now (1 when settled, fades during morphs)
      const w = [0, 1, 2, 3].map((k) => clamp(1 - Math.abs(s - k)));

      // scroll-linked turning while each form plays its motion
      const scrollTurn = w[1] * state.local1 * 0.5 + w[2] * state.local2 * 0.25 - w[3] * state.local3 * 0.15;
      const twirl = Math.sin(Math.PI * eased) * 0.9;
      model.rotation.y = lerp(a.ry, b.ry, eased) + twirl + scrollTurn + Math.sin(t * 0.22) * 0.14 * idle + parallaxX * 0.35;
      model.rotation.x = lerp(a.rx, b.rx, eased) + Math.sin(t * 0.17) * 0.04 * idle + parallaxY * 0.18;
      const x = portrait ? 0 : lerp(a.x, b.x, eased) * halfW;
      const y = portrait ? halfH * 0.3 : 0;
      model.position.set(x, y + Math.sin(t * 0.6) * 0.05 * idle, 0);
      model.scale.setScalar(lerp(a.scale, b.scale, eased) * (1 + w[0] * state.local0 * 0.08));

      // loader: the camera pans upwards with the lifting arm
      const pan = smooth(state.local2) * w[2] * halfH * 0.3;
      camera.position.set(0, pan, camDist);
      camera.lookAt(0, pan, 0);

      uniforms.uLocal.value.set(state.local0, state.local1, smooth(state.local2), state.local3);
      // vault: unlock the handle, then swing the door fully open
      uniforms.uSpin.value = smooth(clamp(state.local3 / 0.35)) * Math.PI * 1.25;
      uniforms.uDoor.value = smooth(clamp((state.local3 - 0.3) / 0.7)) * 1.9;
      uniforms.uStage.value = s;
      uniforms.uTime.value = t;
      uniforms.uHover.value = state.hover;
      uniforms.uDisperse.value = 1 - smooth(clamp(state.visible));
      points.visible = state.visible > 0.002;

      applyPalette(state.tone);
      focus.copy(model.position).project(camera);
      bgUniforms.uFocus.value.set(focus.x, focus.y);
      bgUniforms.uFocusAmount.value = state.visible;
      bgUniforms.uTime.value = t * idle;
      bgUniforms.uScroll.value = state.scroll / viewH;
      bgUniforms.uTone.value = clamp(state.tone, 0, PALETTES.length - 1);
      ambientUniforms.uTime.value = t * idle;
      ambientUniforms.uScroll.value = (state.scroll / viewH) * halfH * 0.9;

      renderer.render(scene, camera);
      if (!reducedMotion) raf = requestAnimationFrame(frame);
    }

    let onStaticScroll: (() => void) | undefined;
    if (reducedMotion) {
      onStaticScroll = () => frame(performance.now());
      window.addEventListener("scroll", onStaticScroll, { passive: true });
      frame(performance.now());
    } else {
      raf = requestAnimationFrame(frame);
    }
    container.classList.add("is-ready");

    return () => {
      cancelAnimationFrame(raf);
      if (onStaticScroll) window.removeEventListener("scroll", onStaticScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      background.geometry.dispose();
      (background.material as THREE.Material).dispose();
      ambientGeometry.dispose();
      (ambient.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="gp-morph-scene" aria-hidden="true" />;
}
