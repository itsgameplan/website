"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createMorphTargets, LOADER_PIVOT, VAULT_BARS, type FormName } from "@/lib/morph-shapes";
import { drawSurveyMap } from "@/lib/survey-map";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createMomentumStage, sampleMomentumPoints } from "@/components/ui/momentum-stage";
import { createSolidForms } from "@/components/ui/solid-forms";
import { createAdviseIcon } from "@/lib/advise-icons";
import { ADVISE_ICON_COUNT, adviseIconFrame, adviseTimeline } from "@/lib/advise-timeline";

const FORMS: FormName[] = ["origin", "sports", "loader", "vault"];
/**
 * Scroll story: fiber stream (home) → loader (ventures / Cairo Tech) → vault (advisory)
 * → Momentum → sport balls (about). All sections also drive the background palette.
 */
const SECTION_IDS = ["home", "ventures", "advisory", "momentum", "about", "process", "apply"];
const LOADER = 1;
const VAULT = 2;
const MOMENTUM = 3;
const SPORTS = 4;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Per-form framing. `x` is a fraction of the visible half-width (0 = centre,
 * positive = right). Portrait screens always centre the object.
 */
const POSE = [
  { rx: 0.12, ry: 0.0, x: 0, scale: 1.0 },     // fiber stream
  { rx: 0.2, ry: -0.62, x: -0.1, scale: 1.0 }, // loader
  { rx: 0.06, ry: 0.0, x: 0, scale: 1.08 },    // vault
];
/** Middle of the bucket mouth, in the loader design space (the point the loader drives at the camera). */
const BUCKET_MOUTH: [number, number] = [1.98, -0.2];
/** English (copy on the left): the loader sits right of centre, between the copy and the survey drawing. */
const LOADER_X_LTR = 0.16;
const SPORTS_POSE = { rx: 0.1, ry: -0.28, x: 0.44, scale: 0.92 }; // balls, on the right
/** "We advise" icons sit this far from centre (fraction of the half-width), opposite the pinned copy */
const ICON_X = 0.5;
/** texels per row of the icon textures (rows = particles / ICON_TEX_W, per icon) */
const ICON_TEX_W = 512;

/** Void palette per section (same order as SECTION_IDS): gradient top, gradient bottom, light-beam colour. */
const PALETTES: [number, number, number][] = [
  [0x10263b, 0x05090f, 0x2f5fbf], // home — midnight, navy blue light
  [0x1f1d19, 0x0c0b09, 0xf2b632], // ventures (Cairo Tech) — charcoal survey map, site-yellow light
  [0x17130c, 0x050403, 0xe8b45a], // advisory (vault, ASL) — black lacquer, art deco gold
  [0x1b2a4c, 0x070a16, 0xa9c2f0], // momentum — periwinkle void, soft blue light
  [0x0f2c42, 0x050d16, 0x8ccfff], // about (sport balls) — deep ocean, cool light
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
  uniform sampler2D uMap;      // Cairo Tech survey map (R lines, G labels, B grid)
  uniform vec4 uMapRect;       // section rect on screen: x, y (from top), w, h — fractions of the viewport
  uniform float uMapOn;
  uniform float uMapReveal;
  uniform float uMapLabels;
  uniform float uDeco;         // vault section art deco weight
  uniform float uDecoT;        // scroll position driving the art deco motion
  uniform sampler2D uLogo;     // ASL lockup (white, alpha)
  uniform vec4 uLogoRect;      // where it sits on screen: x, y (from top), w, h — fractions of the viewport
  uniform float uLogoAmt;
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

  /* ---- Art deco (vault section): gold line-work that moves with scroll ---- */
  float decoLine(float d, float w) { float fw = fwidth(d); return 1.0 - smoothstep(w, w + fw * 1.5, abs(d)); }
  // rectangle with stepped (ziggurat) corners, measured on the mirrored quadrant
  float steppedRect(vec2 q, vec2 h, float s) {
    float a = max(q.x - h.x, q.y - h.y + s * 2.0);
    float b = max(q.x - h.x + s, q.y - h.y + s);
    float c = max(q.x - h.x + s * 2.0, q.y - h.y);
    return min(min(a, b), c);
  }
  float artDeco(vec2 p, float t) {
    vec2 q = abs(p);
    float v = 0.0;
    // nested stepped frames streaming outward as you scroll (endless and reversible)
    for (int i = 0; i < 7; i++) {
      float k = fract(float(i) / 7.0 + t * 0.2);
      float sz = mix(0.06, 1.3, k);
      float d = steppedRect(q, vec2(sz * 0.8, sz), sz * 0.09);
      float life = smoothstep(0.0, 0.2, k) * (1.0 - smoothstep(0.72, 1.0, k));
      v += (decoLine(d, 0.0016) + decoLine(d + 0.016, 0.0009) * 0.65) * life; // doubled rule, deco style
    }
    // sunburst fanning down from above the frame; the rays sweep with scroll
    vec2 o = p - vec2(0.0, 0.8);
    float r = length(o);
    float ang = atan(o.x, -o.y);
    float rays = 24.0;
    float rd = r * (fract(ang * rays / 3.14159265 + t * 0.6) - 0.5) * 3.14159265 / rays;
    v += decoLine(rd, 0.0008) * smoothstep(0.3, 0.5, r) * (1.0 - smoothstep(0.95, 1.45, r)) * step(abs(ang), 1.2) * 0.5;
    // stepped columns on both sides; their tops rise and fall like a skyline as you scroll
    float side = uAspect * 0.5;
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float x0 = side * (0.58 + fi * 0.065), x1 = side * (0.58 + (fi + 1.0) * 0.065);
      float top = 0.34 - fi * 0.075 + 0.07 * sin(t * 2.2 + fi * 0.9);
      v += decoLine(q.x - x0, 0.0013) * step(p.y, top) * 0.85;
      v += decoLine(p.y - top, 0.0013) * step(x0, q.x) * 0.85; // turns 90° and runs out to the screen edge
    }
    // chevrons marching down beneath the vault
    float cy = p.y + q.x * 0.6;
    float chev = (fract(cy * 7.0 + t * 1.4) - 0.5) / 7.0;
    v += decoLine(chev, 0.0013) * step(p.y, -0.2) * step(q.x, 0.38) * 0.7;
    return v;
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

    // Cairo Tech survey map: a fixed texture pinned to the section, swept in once like a plotter
    if (uMapOn > 0.5) {
      vec2 m = vec2((vUv.x - uMapRect.x) / uMapRect.z, ((1.0 - vUv.y) - uMapRect.y) / uMapRect.w);
      if (m.x >= 0.0 && m.x <= 1.0 && m.y >= 0.0 && m.y <= 1.0) {
        vec3 s = texture2D(uMap, vec2(m.x, 1.0 - m.y)).rgb;
        float edge = smoothstep(0.0, 0.1, m.y) * (1.0 - smoothstep(0.9, 1.0, m.y));
        float sweep = smoothstep(0.0, 0.04, uMapReveal * 1.12 - m.y - hash(floor(m * 90.0)) * 0.06);
        vec3 gold = vec3(0.95, 0.71, 0.2);
        col += gold * (s.r * 0.5 * sweep + s.b * 0.07 * uMapReveal) * edge;
        col += vec3(0.97, 0.78, 0.33) * s.g * 0.85 * uMapLabels * edge;
      }
    }

    // vault section: art deco line-work
    if (uDeco > 0.001) col += mix(uBeam, vec3(1.0, 0.92, 0.72), 0.25) * artDeco(p, uDecoT) * 0.5 * uDeco;

    vec2 fp = p - uFocus * vec2(uAspect * 0.5, 0.5);
    col += uBeam * exp(-dot(fp, fp) / 0.16) * 0.1 * uFocusAmount;

    col *= 1.0 - 0.5 * dot(p * vec2(0.75, 1.0), p * vec2(0.75, 1.0));

    // ASL mark: part of the backdrop, so the vault (and everything 3D) passes in front of it
    if (uLogoAmt > 0.001) {
      vec2 lm = vec2((vUv.x - uLogoRect.x) / uLogoRect.z, ((1.0 - vUv.y) - uLogoRect.y) / uLogoRect.w);
      if (lm.x >= 0.0 && lm.x <= 1.0 && lm.y >= 0.0 && lm.y <= 1.0) {
        float a = texture2D(uLogo, vec2(lm.x, 1.0 - lm.y)).a;
        col = mix(col, vec3(0.97, 0.96, 0.94), a * 0.92 * uLogoAmt);
      }
      // soft gold glow around the mark
      vec2 lc = vec2((vUv.x - uLogoRect.x - uLogoRect.z * 0.5) * uAspect, (1.0 - vUv.y) - uLogoRect.y - uLogoRect.w * 0.5);
      col += uBeam * exp(-dot(lc, lc) / (uLogoRect.w * uLogoRect.w * 0.35)) * 0.08 * uLogoAmt;
    }
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
  uniform float uAmount;   // 0 in the vault section: only the vault is rendered there
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, r) * vAlpha * 0.4 * uAmount;
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
  attribute vec3 aGlass;     // target point on a Momentum object, in that object's space
  attribute float aGlassPart; // which object: 0 glass, 1 logo, 2-5 sachets
  attribute vec3 aGlassCol;  // colour of that spot on the object
  attribute float aIndex;    // particle index (looks up its point in each "we advise" icon)

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
  uniform float uStreamScale; // stretches the hero stream across the full screen width
  uniform float uStreamPhase; // ripple phase along the stream, integrated per frame from its (scroll-driven) speed
  uniform float uSolid;  // 1 while the solid model has replaced the particles
  uniform vec4 uLocal;   // x: stream energy, y: balls apart, z: arm lift
  uniform vec2 uPointer;
  uniform vec2 uHinge;
  uniform vec2 uHub;
  uniform vec2 uPivot;
  uniform mat4 uMT[6];        // each Momentum object's space → this object's space
  uniform float uToGlass;     // vault → Momentum morph progress
  uniform float uSolidM;      // 1 while the solid Momentum objects have replaced the particles
  uniform float uToSports;    // Momentum → sport balls morph progress
  uniform float uSolidS;      // 1 while the solid balls have replaced the particles
  uniform float uQuiet;       // 1 in the vault section: hide the dust shell so only the vault renders
  uniform float uGlassPoint;  // point-size factor so particles read at the stage's scale
  uniform sampler2D uIconPos; // "we advise" icons: one RGBA texel per particle, uIconRows rows per icon
  uniform sampler2D uIconCol;
  uniform float uIconRows;
  uniform float uIconMix;     // 0 strand → 1 icon
  uniform float uIconA;       // icon being shown …
  uniform float uIconB;       // … the next one …
  uniform float uIconF;       // … and how far the morph between them has got

  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  vec2 rot2(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
  vec3 hash3(float n) { return fract(sin(vec3(n, n + 1.7, n + 3.1) * vec3(43758.5453, 22578.1459, 19642.349))); }

  vec3 gStreamPos;
  vec3 gStreamCol;
  float gIconW = 0.0; // how much this particle is part of an icon right now

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
    vec3 p = vec3(x * (1.0 + E * 0.3) * uStreamScale, yc * (1.0 + E * 0.8) + v * h * c, v * h * s * 1.15 + position.z);
    // scroll makes the strands ripple faster and harder. The ripple's phase is integrated on the CPU
    // (uStreamPhase), so a change in E speeds the wave up instead of jumping it: with t * E here, any
    // scroll change shifted the phase by up to 6 * t radians and the strand shook while the page moved.
    p.y += sin(x * 3.2 - uStreamPhase + v * 1.5) * 0.06 * (0.3 + E * 1.6);
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

  mat4 targetMat(float k) {
    if (k < 0.5) return uMT[0];
    if (k < 1.5) return uMT[1];
    if (k < 2.5) return uMT[2];
    if (k < 3.5) return uMT[3];
    if (k < 4.5) return uMT[4];
    return uMT[5];
  }

  // scroll story order: 0 fiber stream → 1 loader → 2 vault (then Momentum, then the balls)
  vec3 posAt(float k) {
    if (k < 0.5) return gStreamPos;
    if (k < 1.5) return loaderPos();
    return vaultPos();
  }
  vec3 colAt(float k) {
    if (k < 0.5) return gStreamCol;
    if (k < 1.5) return aCol2;
    return aCol3;
  }

  vec4 iconTexel(sampler2D t, float k) {
    int idx = int(aIndex + 0.5);
    return texelFetch(t, ivec2(idx % 512, idx / 512 + int(k + 0.5) * int(uIconRows + 0.5)), 0);
  }
  float quintic(float e) { return e * e * e * (e * (e * 6.0 - 15.0) + 10.0); }

  // 01b — "we advise": the strand re-forms into one icon per service, then flows icon to icon
  void iconBlend(float r) {
    if (uIconMix < 0.001) return;
    vec3 dir = normalize(hash3(r * 57.3) - 0.5 + 1e-4);
    vec3 a = iconTexel(uIconPos, uIconA).xyz;
    vec3 b = iconTexel(uIconPos, uIconB).xyz;
    // icon → icon: a staggered sweep, so the shape rebuilds from one side with a little lift
    float sw = clamp(0.5 + a.x * 0.16 + (r - 0.5) * 0.45, 0.0, 1.0);
    float g = quintic(clamp(uIconF * 1.8 - sw * 0.8, 0.0, 1.0));
    vec3 ip = mix(a, b, g) + dir * sin(3.14159265 * g) * 0.42;
    ip += vec3(sin(uTime * 1.1 + r * 37.0), cos(uTime * 0.9 + r * 23.0), sin(uTime * 0.7 + r * 11.0)) * 0.012 * uIdle;
    vec3 ic = mix(iconTexel(uIconCol, uIconA).rgb, iconTexel(uIconCol, uIconB).rgb, g);
    // strand → icon: particles leave the strand left to right
    float sm = clamp(0.5 + position.x * 0.05 + (r - 0.5) * 0.5, 0.0, 1.0);
    float m = quintic(clamp(uIconMix * 1.8 - sm * 0.8, 0.0, 1.0));
    gStreamPos = mix(gStreamPos, ip, m) + dir * sin(3.14159265 * m) * 0.6;
    gStreamCol = mix(gStreamCol, ic, m);
    gIconW = m;
  }

  void main() {
    float r = aMeta.x;
    bool dust = aMeta.y > 2.5;
    if (dust) { gStreamPos = position * 1.4; gStreamCol = aCol0; } else { stream(r); iconBlend(r); }

    float st = clamp(uStage, 0.0, 2.0);
    float i = min(floor(st), 1.0);
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

    // 04 → Momentum: the vault's particles stream into the glass, logo and sachets
    float gs = 0.0;
    if (!dust && uToGlass > 0.0) {
      gs = clamp(uToGlass * 1.7 - r * 0.7, 0.0, 1.0);
      gs = gs * gs * gs * (gs * (gs * 6.0 - 15.0) + 10.0);
      vec3 gp = (targetMat(aGlassPart) * vec4(aGlass, 1.0)).xyz;
      p = mix(p, gp, gs) + dir * sin(3.14159265 * gs) * 0.22;
    }
    // Momentum → sport balls: the stage's particles fly out to the balls on the right
    float ss = 0.0;
    if (!dust && uToSports > 0.0) {
      ss = clamp(uToSports * 1.7 - r * 0.7, 0.0, 1.0);
      ss = ss * ss * ss * (ss * (ss * 6.0 - 15.0) + 10.0);
      p = mix(p, sportsPos(), ss) + dir * sin(3.14159265 * ss) * 0.35;
    }
    // finale (after the balls): everything breaks back into particles that scatter and vanish
    p += dir * uDisperse * (0.5 + r * 1.4);

    // smaller and fainter the further a particle is from the centre
    // (the hero stream is stretched to the screen width, so measure its fade before the stretch)
    // (icons are not stretched, so they measure it unstretched)
    float sx = mix(mix(uStreamScale, 1.0, clamp(uStage, 0.0, 1.0)), 1.0, gIconW);
    float fade = smoothstep(1.6, 4.6, length(vec3(p.x / sx, p.y, p.z)));

    vec4 world = modelMatrix * vec4(p, 1.0);
    vec2 d = world.xy - uPointer;
    float infl = uHover * exp(-dot(d, d) / 0.5);
    world.xy += normalize(d + 1e-4) * infl * 0.5;
    world.z += infl * 0.45;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    // particles fade and shrink away while the solid model materialises in their place
    float solid = dust ? 0.0 : uSolid;
    float size = uSize * (dust ? 0.7 : 1.0) * (0.85 + r * 0.3) * (1.0 + arc * 0.2) * (1.0 - 0.65 * fade) * (1.0 - 0.6 * solid);
    // the camera is inside the vault by now, so scale points to the glass's framing as soon as the morph begins
    // (and back to normal as they leave for the balls)
    size *= mix(1.0, uGlassPoint, max(gs, clamp(uToGlass * 3.0, 0.0, 1.0)) * (1.0 - ss));
    gl_PointSize = clamp(size * uScale / -mv.z, 0.8, 12.0);

    vColor = mix(colAt(i), colAt(i + 1.0), e) * (1.0 + infl * 0.35);
    vColor = mix(vColor, aGlassCol, gs);
    vColor = mix(vColor, aCol1, ss);
    // dust bows out as the vault turns into Momentum; the rest hand over to (and back from) the solid objects
    float handover = dust ? (1.0 - uToGlass) * (1.0 - uQuiet) : (1.0 - uSolidM) * (1.0 - uSolidS);
    vAlpha = (dust ? 0.35 : 1.0) * (1.0 - uDisperse) * ie * (1.0 - 0.92 * fade) * (1.0 - solid) * handover;
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
    const momentumPoints = sampleMomentumPoints(count);
    geometry.setAttribute("aGlass", new THREE.BufferAttribute(momentumPoints.pos, 3));
    geometry.setAttribute("aGlassPart", new THREE.BufferAttribute(momentumPoints.part, 1));
    geometry.setAttribute("aGlassCol", new THREE.BufferAttribute(momentumPoints.col, 3));
    // "we advise" icons: each particle's point (and colour) in every icon, read in the shader by index;
    // the attribute budget is nearly spent, so they live in textures, filled once the page is idle
    const index = new Float32Array(count);
    for (let i = 0; i < count; i++) index[i] = i;
    geometry.setAttribute("aIndex", new THREE.BufferAttribute(index, 1));
    const iconRows = Math.ceil(count / ICON_TEX_W);
    const iconPosTex = new THREE.DataTexture(new Float32Array(ICON_TEX_W * iconRows * ADVISE_ICON_COUNT * 4), ICON_TEX_W, iconRows * ADVISE_ICON_COUNT, THREE.RGBAFormat, THREE.FloatType);
    const iconColTex = new THREE.DataTexture(new Uint8Array(ICON_TEX_W * iconRows * ADVISE_ICON_COUNT * 4), ICON_TEX_W, iconRows * ADVISE_ICON_COUNT, THREE.RGBAFormat, THREE.UnsignedByteType);
    for (const tex of [iconPosTex, iconColTex]) { tex.minFilter = tex.magFilter = THREE.NearestFilter; tex.generateMipmaps = false; }
    // built one icon per idle slot (~40 ms each) so the page never stalls; shown once all are in
    let iconsReady = false;
    let iconsBuilt = 0;
    const hasIdle = typeof window.requestIdleCallback === "function";
    let iconJob: number | ReturnType<typeof setTimeout> = 0;
    const schedule = () => { iconJob = hasIdle ? window.requestIdleCallback(fillNextIcon, { timeout: 1500 }) : globalThis.setTimeout(fillNextIcon, 120); };
    function fillNextIcon() {
      const k = iconsBuilt;
      const icon = createAdviseIcon(k, count);
      const pos = iconPosTex.image.data as Float32Array;
      const col = iconColTex.image.data as Uint8Array;
      const base = k * iconRows * ICON_TEX_W;
      for (let i = 0; i < count; i++) {
        const o = (base + i) * 4;
        pos[o] = icon.positions[i * 3]; pos[o + 1] = icon.positions[i * 3 + 1]; pos[o + 2] = icon.positions[i * 3 + 2]; pos[o + 3] = 1;
        col[o] = icon.colors[i * 3] * 255; col[o + 1] = icon.colors[i * 3 + 1] * 255; col[o + 2] = icon.colors[i * 3 + 2] * 255; col[o + 3] = 255;
      }
      iconsBuilt++;
      if (iconsBuilt < ADVISE_ICON_COUNT) { schedule(); return; }
      iconPosTex.needsUpdate = true;
      iconColTex.needsUpdate = true;
      iconsReady = true;
    }
    schedule();
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
      uStreamScale: { value: 1 },
      uStreamPhase: { value: 0 },
      uSolid: { value: 0 },
      uMT: { value: Array.from({ length: 6 }, () => new THREE.Matrix4()) },
      uToGlass: { value: 0 },
      uSolidM: { value: 0 },
      uToSports: { value: 0 },
      uSolidS: { value: 0 },
      uQuiet: { value: 0 },
      uGlassPoint: { value: 1 },
      uLocal: { value: new THREE.Vector4() },
      uPointer: { value: new THREE.Vector2(99, 99) },
      uHinge: { value: new THREE.Vector2(...targets.vaultHinge) },
      uHub: { value: new THREE.Vector2(...targets.vaultHub) },
      uPivot: { value: new THREE.Vector2(...targets.loaderPivot) },
      uOpacity: { value: 1 },
      uIconPos: { value: iconPosTex },
      uIconCol: { value: iconColTex },
      uIconRows: { value: iconRows },
      uIconMix: { value: 0 },
      uIconA: { value: 0 },
      uIconB: { value: 1 },
      uIconF: { value: 0 },
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
      uMap: { value: null as THREE.Texture | null },
      uMapRect: { value: new THREE.Vector4(0, 2, 1, 1) },
      uMapOn: { value: 0 },
      uMapReveal: { value: 0 },
      uMapLabels: { value: 0 },
      uDeco: { value: 0 },
      uDecoT: { value: 0 },
      uLogo: { value: null as THREE.Texture | null },
      uLogoRect: { value: new THREE.Vector4(0, 2, 0.1, 0.1) },
      uLogoAmt: { value: 0 },
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
      uAmount: { value: 1 },
    };
    const ambient = new THREE.Points(ambientGeometry, new THREE.ShaderMaterial({
      uniforms: ambientUniforms, vertexShader: ambientVertex, fragmentShader: ambientFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    ambient.frustumCulled = false;
    ambient.renderOrder = 1;

    const momentum = createMomentumStage(renderer, { mirror: !!document.querySelector(".gp-ar") });
    const solids = createSolidForms(targets);
    model.add(solids.sports, solids.loader, solids.vault);
    const scene = new THREE.Scene();
    // the Momentum stage hangs off a camera-relative anchor (see frame())
    /* ---- Cairo Tech survey map: drawn once into a texture, pinned to its section ---- */
    /* ---- ASL mark for the vault section (drawn in the backdrop, behind the vault) ---- */
    // Arabic reads right-to-left: the balls (and the ASL mark) sit on the opposite side
    const sideSign = document.querySelector(".gp-ar") ? -1 : 1;
    const poses = POSE.map((p, n) => (n === 1 && sideSign > 0 ? { ...p, x: LOADER_X_LTR } : p));
    const LOGO_ASPECT = 1037 / 811;
    let logoTexture: THREE.Texture | null = null;
    new THREE.TextureLoader().load("/asl/asl-lockup-white.svg", (tex) => {
      logoTexture = tex;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      bgUniforms.uLogo.value = tex;
    });
    function updateLogo(amount: number) {
      // phones: the copy covers the right-hand side, so the mark is left out there
      bgUniforms.uLogoAmt.value = logoTexture && window.innerWidth >= 700 ? amount : 0;
      // right-hand side, vertically centred (mirrored for Arabic)
      const vw = window.innerWidth;
      const mobileLayout = vw < 700;
      const w = mobileLayout ? 0.3 : Math.min(0.17, 260 / vw);
      const h = (w * vw) / LOGO_ASPECT / viewH;
      const rtl = document.documentElement.dir === "rtl" || !!document.querySelector(".gp-ar");
      const x = rtl ? 0.065 : 1 - 0.065 - w;
      const y = mobileLayout ? 0.12 : 0.5 - h / 2;
      bgUniforms.uLogoRect.value.set(x, y, w, h);
    }

    /* ---- loader → gold bar: a veil in the loader paint closes over the screen as the bucket fills it ---- */
    const veilEl = document.createElement("div");
    veilEl.className = "gp-morph-veil";
    container.appendChild(veilEl);
    let veilLast = -1;
    function setVeil(v: number) {
      const q = Math.round(v * 1000) / 1000;
      if (q === veilLast) return;
      veilLast = q;
      veilEl.style.opacity = String(q);
    }

    /* ---- pinned section copy (loader, vault) driven by the 3D timeline ---- */
    const pinLoader = document.getElementById("gp-pin-loader");
    const pinVault = document.getElementById("gp-pin-vault");
    const pinCache = new Map<HTMLElement, string>();
    function setPin(el: HTMLElement | null, inV: number, outV: number) {
      if (!el) return;
      const key = `${inV.toFixed(3)}|${outV.toFixed(3)}`;
      if (pinCache.get(el) === key) return;
      pinCache.set(el, key);
      el.style.setProperty("--in", inV.toFixed(3));
      el.style.setProperty("--out", outV.toFixed(3));
      const shown = inV * (1 - outV);
      el.classList.toggle("is-live", shown > 0.6);
      el.classList.toggle("is-hidden", shown < 0.002);
    }

    const mapSection = document.getElementById(SECTION_IDS[LOADER]);
    let mapTexture: THREE.CanvasTexture | null = null;
    let mapDrawStart = -1;
    const mapTimer = window.setTimeout(() => {
      if (!mapSection) return;
      const build = () => {
        const r = mapSection.getBoundingClientRect();
        const w = 2048;
        const h = Math.min(4096, Math.round(w * (r.height / Math.max(1, r.width))));
        mapTexture = new THREE.CanvasTexture(drawSurveyMap(w, h));
        mapTexture.anisotropy = 8;
        bgUniforms.uMap.value = mapTexture;
        bgUniforms.uMapOn.value = 1;
      };
      // wait for the mono font so the elevation labels render in it
      document.fonts.load('600 14px "IBM Plex Mono"').then(build, build);
    }, 400);
    function updateSurveyMap(t: number) {
      if (!mapSection || !mapTexture) return;
      const r = mapSection.getBoundingClientRect();
      bgUniforms.uMapRect.value.set(r.left / window.innerWidth, r.top / viewH, r.width / window.innerWidth, r.height / viewH);
      // plot it the first time the section comes into view; after that it stays drawn
      if (mapDrawStart < 0 && r.top < viewH * 0.75 && r.bottom > 0) mapDrawStart = t;
      const since = mapDrawStart < 0 ? 0 : (reducedMotion ? 10 : t - mapDrawStart);
      bgUniforms.uMapReveal.value = smooth(clamp(since / 2.8));
      bgUniforms.uMapLabels.value = smooth(clamp((since - 2.3) / 0.8));
    }

    const anchor = new THREE.Group();
    anchor.matrixAutoUpdate = false;
    anchor.add(momentum.group);
    scene.add(background, ambient, model, anchor);

    // studio lighting for the solid models (the particle and void shaders are unlit)
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envMap;
    scene.environmentIntensity = 0.85;
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.4);
    keyLight.position.set(-4, 6, 7);
    const rimLight = new THREE.DirectionalLight(0xbfd6ff, 1.4);
    rimLight.position.set(5, 2, -4);
    scene.add(keyLight, rimLight);
    // the loader is lit like a real machine on site: the key light casts soft shadows (only the
    // loader's meshes cast/receive them), sky/ground bounce fills the shadows, and a low warm light
    // from the site-yellow beam picks out the underside of the arm and bucket
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.radius = 5;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.normalBias = 0.025;
    keyLight.shadow.intensity = 0;
    Object.assign(keyLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 30 });
    keyLight.shadow.camera.updateProjectionMatrix();
    const skyFill = new THREE.HemisphereLight(0xfff3dd, 0x2b2114, 0);
    const bounce = new THREE.DirectionalLight(0xffb43a, 0);
    bounce.position.set(3, -3, 5);
    scene.add(skyFill, bounce);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
    const vaultBars = new THREE.Vector3(...targets.vaultBars);
    // top face of the top (hallmarked) gold bar, in the vault's normalised space
    const vf = targets.frames.vault;
    const topBar = VAULT_BARS[VAULT_BARS.length - 1];
    const topBarTop = new THREE.Vector3((topBar[0] - vf.center[0]) * vf.scale, (topBar[1] + 0.075 - vf.center[1]) * vf.scale, (topBar[2] - vf.center[2]) * vf.scale);
    const topBarWorld = new THREE.Vector3();
    const overheadPos = new THREE.Vector3();
    const overheadOffset = new THREE.Vector3(0, 1.18, 0.001); // straight above the bar, inside the vault
    const upInto = new THREE.Vector3(0, 0, -1);
    // centre of the hallmark emblem: 70px above the middle of the 840px-tall, 0.56-deep bar face (towards -z)
    const emblemOffset = new THREE.Vector3(0, 0, -(70 / 840) * 0.56 * vf.scale);
    const emblemWorld = new THREE.Vector3();
    const zoomLook = new THREE.Vector3();
    const zoomUp = new THREE.Vector3();
    const ZOOM_START = 0.07; // camera height above the emblem centre when the veil lifts

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "gp-morph-canvas";
    container.prepend(renderer.domElement);

    /* ---- layout ---- */
    let anchors = SECTION_IDS.map(() => 0);
    let trackEnd = 1;
    let momentumEnd = 2;
    let sportsEnd = 3;
    let adviseTop = -1e9;
    let adviseHeight = 0;
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
      uniforms.uStreamScale.value = portrait ? 1 : Math.max(1, (halfW * 1.04) / 4.4); // stream half-width is 4.4
      momentum.setPointScale(uniforms.uScale.value);
      bgUniforms.uAspect.value = camera.aspect;
      ambientUniforms.uHalf.value.set(halfW, halfH);
      anchors = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      });
      trackEnd = track!.getBoundingClientRect().bottom + window.scrollY;
      const m = document.getElementById(SECTION_IDS[MOMENTUM]);
      momentumEnd = m ? m.getBoundingClientRect().bottom + window.scrollY : trackEnd + 1;
      const sp = document.getElementById(SECTION_IDS[SPORTS]);
      sportsEnd = sp ? sp.getBoundingClientRect().bottom + window.scrollY : momentumEnd + 1;
      const adv = document.getElementById("advise");
      if (adv) { const r = adv.getBoundingClientRect(); adviseTop = r.top + window.scrollY; adviseHeight = r.height; }
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
      // fiber stream → loader → vault: each morph plays while its section rises from 75% to 25% of the viewport
      // (the loader → vault hand-over is not a particle morph any more: see `cut`)
      const stage = span(y, A[LOADER] - vh * 0.75, A[LOADER] - vh * 0.25);
      // per-form motion, active for the whole time each form is on screen
      const local0 = span(y, 0, A[LOADER] - vh * 0.45);                    // stream energises
      // the loader lifts its arm, turns and drives at the screen until it fills it; the gold bar follows
      const cut = span(y, A[VAULT] - vh * 0.85, A[VAULT] - vh * 0.1);
      // the vault plays backwards: from the top-down gold bar out of the vault, door shuts and locks
      // (local3 keeps its old meaning — 0 locked/outside, 1 overhead — so it runs 1 → 0 here)
      const local3 = 1 - span(y, A[VAULT] + vh * 0.05, trackEnd - vh * 1.1);
      let tone = 0;
      for (let k = 1; k < SECTION_IDS.length; k++) tone += span(y, A[k] - vh * 0.75, A[k] - vh * 0.05);

      // Vault → Momentum, all from where the camera already is (no pull-back)
      const mA = A[MOMENTUM];
      const mE = momentumEnd;
      const toGlass = span(y, mA - vh * 0.65, mA - vh * 0.15);   // bar particles stream into glass, logo, sachets
      const mReveal = span(y, mA - vh * 0.22, mA + vh * 0.08)    // solid objects dissolve in over them…
        * (1 - span(y, mE - vh * 1.15, mE - vh * 0.85));          // …and back into particles at the end
      const mProgress = span(y, mA + vh * 0.08, mE - vh * 1.2);  // the pour, while the copy is pinned

      // Momentum → sport balls on the right; the camera eases home on the way
      const sA = A[SPORTS];
      const sE = sportsEnd;
      const toSports = span(y, mE - vh * 0.9, mE - vh * 0.3);
      const homeBack = span(y, mE - vh * 0.9, mE - vh * 0.35);
      // the heritage copy is pinned from sA until sE - 1vh, so the whole ball sequence plays while it is on screen
      const sReveal = span(y, mE - vh * 0.32, mE - vh * 0.05)    // solid balls take over…
        * (1 - span(y, sE - vh * 1.3, sE - vh * 1.1));            // …and break back into particles at the end
      const local1 = span(y, sA + vh * 0.05, sE - vh * 1.32);     // balls drift apart
      const disperse = span(y, sE - vh * 1.15, sE - vh * 0.75);   // finale: the particles scatter and vanish
      // "we advise": the strand becomes one icon per service while that section is pinned
      const advise = adviseHeight ? adviseTimeline(y, adviseTop, adviseHeight, vh) : { mix: 0, q: 0 };
      return { stage, cut, local0, local1, local3, tone, toGlass, mReveal, mProgress, toSports, sReveal, disperse, homeBack, iconMix: advise.mix, iconQ: advise.q, y };
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
    const camPos = new THREE.Vector3();
    const camLook = new THREE.Vector3();
    const barsWorld = new THREE.Vector3();
    const dollyPos = new THREE.Vector3();
    const dollyOffset = new THREE.Vector3(0, 0.3, 2.15); // where the camera ends up, relative to the bars
    const bucketWorld = new THREE.Vector3();
    const driveCam = new THREE.Vector3();
    const driveOffset = new THREE.Vector3();
    const homePos = new THREE.Vector3();
    const homeLook = new THREE.Vector3();
    const focusM = new THREE.Vector3();
    const anchorScale = new THREE.Matrix4();
    const modelInverse = new THREE.Matrix4();
    const dollyFrame = new THREE.Matrix4();
    const dollyEuler = new THREE.Euler();
    const dollyScale = new THREE.Vector3();
    const homeCamInverse = new THREE.Matrix4();

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
        state.local3 = damp(state.local3, target.local3, 5, dt);
        state.cut = damp(state.cut, target.cut, 5, dt);
        state.mReveal = damp(state.mReveal, target.mReveal, 5, dt);
        state.disperse = damp(state.disperse, target.disperse, 5, dt);
        state.mProgress = damp(state.mProgress, target.mProgress, 5, dt);
        state.tone = damp(state.tone, target.tone, 3, dt);
        state.toGlass = damp(state.toGlass, target.toGlass, 5, dt);
        state.homeBack = damp(state.homeBack, target.homeBack, 5, dt);
        state.toSports = damp(state.toSports, target.toSports, 5, dt);
        state.sReveal = damp(state.sReveal, target.sReveal, 5, dt);
        state.iconMix = damp(state.iconMix, target.iconMix, 4.5, dt);
        state.iconQ = damp(state.iconQ, target.iconQ, 4.5, dt);
        state.scroll = damp(state.scroll, target.y, 5, dt);
        state.hover = damp(state.hover, pointerInside ? 1 : 0, 5, dt);
        uniforms.uSpread.value = damp(uniforms.uSpread.value, 1 + Math.min(gap * 0.9, 0.9), 3, dt);
        uniforms.uIntro.value = clamp(t / 2.6);
        parallaxX = damp(parallaxX, targetParX, 2.5, dt);
        parallaxY = damp(parallaxY, targetParY, 2.5, dt);
      }

      const idle = reducedMotion ? 0 : 1;
      // loader → gold bar (cut): 0→.6 the loader lifts its arm, turns and drives at the screen while the
      // veil closes over it (.42→.6); the vault swaps in behind the veil (.6→.64); the veil lifts on the
      // centre of the hallmark emblem (.64→.76) and the camera zooms out to the whole bar (.66→1)
      const cut = clamp(state.cut);
      const drive = smooth(clamp(cut / 0.6));
      const veil = smooth(clamp((cut - 0.42) / 0.18)) * (1 - smooth(clamp((cut - 0.64) / 0.12)));
      const s = clamp(state.stage, 0, 1) + smooth(clamp((cut - 0.6) / 0.04));
      const zoom = smooth(clamp((cut - 0.66) / 0.34));
      const i = Math.min(1, Math.floor(s));
      const f = s - i;
      const eased = smooth(clamp((f - 0.1) / 0.8));
      const a = poses[i], b = poses[i + 1];
      // how present each form is right now (1 when settled, fades during morphs): 0 stream, 1 loader, 2 vault
      const w = [0, 1, 2].map((n) => clamp(1 - Math.abs(s - n)));
      const back = smooth(clamp(state.homeBack));
      // the balls take over the model's framing once Momentum hands over to them
      const sp = smooth(clamp(state.toSports));

      // vault timeline (local3, played from 1 down to 0 as you scroll): the camera starts straight above
      // the hallmarked bar (.95→.55 it drops back from it), backs out of the vault (.5→.1) as the door
      // swings shut (.45→.15), and the handle spins to lock it (.18→0)
      const dolly = smooth(clamp((state.local3 - 0.1) / 0.4)) * w[2];
      const overhead = smooth(clamp((state.local3 - 0.55) / 0.4)) * w[2];
      const driving = drive * w[1];
      // hold the object steady while the camera is inside the vault or the loader is driving at it
      const calm = 1 - Math.max(dolly * (1 - back), driving);

      // pinned copy follows the objects: loader copy rises in as the loader forms and leaves as it
      // starts its drive; vault copy rises in once the camera is out and leaves as Momentum takes over
      const loaderIn = smooth(clamp((s - 0.62) / 0.38));
      const loaderOut = smooth(clamp(cut / 0.22));
      setPin(pinLoader, loaderIn, loaderOut);
      setPin(pinVault, smooth(clamp((s - 1.62) / 0.38)) * (1 - smooth(clamp((dolly - 0.05) / 0.3))), smooth(clamp(state.toGlass / 0.35)));
      setVeil(veil);
      document.documentElement.classList.toggle("gp-loader-on", loaderIn > 0.85 && loaderOut < 0.4);

      // scroll-linked turning while each form plays its motion
      const twirl = Math.sin(Math.PI * eased) * 0.9;
      // the loader swings round until its bucket points straight at the screen
      const turn = smooth(clamp(cut / 0.45)) * w[1];
      const baseRy = lerp(lerp(a.ry, b.ry, eased) + twirl, -Math.PI / 2, turn);
      // the arm lifts in the same move (no separate lift beforehand)
      const lift = smooth(clamp(cut / 0.5)) * 0.95 * w[1];
      const ballsRy = SPORTS_POSE.ry * sideSign + state.local1 * 0.5;
      model.rotation.y = lerp(baseRy, ballsRy, sp) + (Math.sin(t * 0.22) * 0.14 * idle + parallaxX * 0.35) * calm;
      model.rotation.x = lerp(lerp(a.rx, b.rx, eased), SPORTS_POSE.rx, sp) + (Math.sin(t * 0.17) * 0.04 * idle + parallaxY * 0.18) * calm;
      // "we advise" icons: shown opposite the pinned copy on wide screens, above it on phones
      const iconMix = iconsReady ? clamp(state.iconMix) : 0;
      const iconFrame = adviseIconFrame(clamp(state.iconQ, 0, ADVISE_ICON_COUNT - 1));
      uniforms.uIconMix.value = iconMix;
      uniforms.uIconA.value = iconFrame.a;
      uniforms.uIconB.value = iconFrame.b;
      uniforms.uIconF.value = iconFrame.f;
      const iconShift = portrait ? 0 : smooth(iconMix) * w[0] * ICON_X * sideSign * halfW;
      const x = (portrait ? 0 : lerp(lerp(a.x, b.x, eased), SPORTS_POSE.x * sideSign, sp) * halfW) + iconShift;
      // phones: objects sit in the upper part of the screen, a touch smaller, leaving the lower half to the copy
      const y = portrait ? halfH * 0.36 : 0;
      model.position.set(x, y + Math.sin(t * 0.6) * 0.05 * idle, 0);
      model.scale.setScalar(lerp(lerp(a.scale, b.scale, eased) * (1 + w[0] * state.local0 * 0.08), SPORTS_POSE.scale, sp) * (portrait ? 0.86 : 1));

      // loader: the camera pans upwards with the lifting arm
      const pan = (lift / 0.95) * halfH * 0.15;
      camPos.set(0, pan, camDist);
      camLook.set(0, pan, 0);
      // the bucket comes at the camera until it fills the screen
      if (driving > 0.0001) {
        const ca = Math.cos(lift), sa = Math.sin(lift);
        const dx = BUCKET_MOUTH[0] - LOADER_PIVOT[0], dy = BUCKET_MOUTH[1] - LOADER_PIVOT[1];
        const lf = targets.frames.loader;
        bucketWorld.set(
          (LOADER_PIVOT[0] + dx * ca - dy * sa - lf.center[0]) * lf.scale,
          (LOADER_PIVOT[1] + dx * sa + dy * ca - lf.center[1]) * lf.scale,
          (0 - lf.center[2]) * lf.scale,
        );
        model.updateMatrixWorld(true);
        bucketWorld.applyMatrix4(model.matrixWorld);
        // stop just short of the bucket's mouth (it overfills the frame there; the veil hides any gap)
        driveCam.copy(bucketWorld).add(driveOffset.set(0, 0.05, 0.75 * model.scale.x));
        const ease = driving * driving * (3 - 2 * driving);
        camPos.lerp(driveCam, ease);
        camLook.lerp(bucketWorld, Math.min(1, driving * 1.6));
      }
      if (dolly > 0.0001 && back < 0.9999) {
        // the vault's own framing (before the balls' framing takes over the model)
        dollyFrame.makeRotationFromEuler(dollyEuler.set(lerp(a.rx, b.rx, eased), baseRy, 0));
        dollyFrame.scale(dollyScale.setScalar(lerp(a.scale, b.scale, eased) * (portrait ? 0.86 : 1)));
        dollyFrame.setPosition(portrait ? 0 : lerp(a.x, b.x, eased) * halfW, y + Math.sin(t * 0.6) * 0.05 * idle, 0);
        barsWorld.copy(vaultBars).applyMatrix4(dollyFrame);
        camPos.lerp(dollyPos.copy(barsWorld).add(dollyOffset), dolly);
        camLook.lerp(barsWorld, dolly);
        // then rise over the stack and tilt down until we look straight down on the hallmarked top bar
        if (overhead > 0.0001) {
          topBarWorld.copy(topBarTop).applyMatrix4(dollyFrame);
          // it starts right on the centre of the hallmark emblem and zooms out to the whole bar;
          // the height grows exponentially so the zoom reads at an even pace
          emblemWorld.copy(topBarTop).add(emblemOffset).applyMatrix4(dollyFrame);
          const h = ZOOM_START * Math.pow(overheadOffset.y / ZOOM_START, zoom);
          const g = (h - ZOOM_START) / (overheadOffset.y - ZOOM_START);
          zoomLook.copy(emblemWorld).lerp(topBarWorld, g);
          overheadPos.copy(zoomLook).add(zoomUp.set(0, h, 0.001));
          camPos.lerp(overheadPos, overhead);
          camPos.y += Math.sin(Math.PI * overhead) * 0.18; // a gentle arc as it climbs over the bars
          camLook.lerp(zoomLook, overhead);
        }
      }
      // Momentum → balls: the camera returns home as the particles fly out to the balls
      camPos.lerp(homePos.set(0, 0, camDist), back);
      camLook.lerp(homeLook.set(0, 0, 0), back);
      camera.position.copy(camPos);
      // looking straight down needs a different "up" (into the vault) so the bar reads upright
      camera.up.set(0, 1, 0).lerp(upInto, overhead * (1 - back)).normalize();
      camera.lookAt(camLook);
      camera.updateMatrixWorld();

      // Momentum is anchored to the camera: it keeps its usual on-screen framing wherever the
      // camera is (scaling about the camera keeps the projection identical), so it appears right
      // where the gold bars were instead of after a zoom-out.
      const mP = smooth(clamp(state.mReveal));
      const k = camPos.distanceTo(camLook) / camDist;
      homeCamInverse.makeTranslation(0, 0, -camDist); // home camera sits at (0, 0, camDist) looking down -z
      anchor.matrix.copy(camera.matrixWorld).multiply(anchorScale.makeScale(k, k, k)).multiply(homeCamInverse);
      anchor.matrixWorldNeedsUpdate = true;
      momentum.group.position.set(0, portrait ? halfH * 0.38 : -0.1, 0);
      momentum.group.scale.setScalar(Math.min(1, halfW / 3.4));
      momentum.update({ reveal: mP, progress: state.mProgress, time: t * idle });
      anchor.updateMatrixWorld(true);
      model.updateMatrixWorld(true);
      // particle targets follow each Momentum object (sachets bob and pour, the logo floats)
      modelInverse.copy(model.matrixWorld).invert();
      momentum.targets.forEach((obj, n) => uniforms.uMT.value[n].copy(modelInverse).multiply(obj.matrixWorld));
      uniforms.uToGlass.value = state.toGlass;
      uniforms.uSolidM.value = mP;
      uniforms.uGlassPoint.value = k;
      uniforms.uToSports.value = state.toSports;
      const sR = smooth(clamp(state.sReveal));
      uniforms.uSolidS.value = sR;

      // the stream's ripple speeds up with its energy; integrating speed × dt keeps the wave continuous
      // however fast the energy changes (e.g. a programmatic glide back to the top)
      uniforms.uStreamPhase.value = (uniforms.uStreamPhase.value + dt * (2 + clamp(state.local0) * 6) * idle) % (Math.PI * 2000);
      uniforms.uLocal.value.set(state.local0, state.local1, lift / 0.95, state.local3);
      // vault: unlock the handle, then swing the door fully open
      uniforms.uSpin.value = smooth(clamp(state.local3 / 0.18)) * Math.PI * 1.25;
      uniforms.uDoor.value = smooth(clamp((state.local3 - 0.15) / 0.3)) * 1.9;
      uniforms.uStage.value = s;
      uniforms.uTime.value = t;
      // cursor push is off for the Momentum morph (the camera is very close there, so it would scatter the glass)
      // (it comes back once the particles head out to the balls and the camera is home)
      uniforms.uHover.value = state.hover * (1 - smooth(clamp(state.toGlass / 0.25)) * (1 - sp));
      uniforms.uDisperse.value = smooth(clamp(state.disperse));
      points.visible = uniforms.uDisperse.value < 0.999;

      // once particles settle into a form, the solid model dissolves in and takes over;
      // it dissolves back out as soon as the next morph (or the vault → glass morph) begins
      const settle = (n: number) => smooth(clamp((w[n] - 0.55) / 0.4));
      const loaderSolid = settle(1);
      // loader-only lighting fades with the solid loader (the shadow pass can't see the dissolve)
      const loaderLit = smooth(clamp((loaderSolid - 0.7) / 0.3));
      keyLight.shadow.intensity = 0.9 * loaderLit;
      skyFill.intensity = 0.22 * loaderSolid;
      bounce.intensity = 0.55 * loaderSolid;
      const vaultSolid = settle(2) * (1 - smooth(clamp(state.toGlass / 0.3)));
      uniforms.uSolid.value = Math.max(loaderSolid, vaultSolid);
      solids.update({ reveal: [sR, loaderSolid, vaultSolid], apart: state.local1, lift, spin: uniforms.uSpin.value, door: uniforms.uDoor.value });

      applyPalette(state.tone);
      focus.copy(model.position).lerp(momentum.group.getWorldPosition(focusM), Math.max(mP, state.toGlass) * (1 - sp)).project(camera);
      bgUniforms.uFocus.value.set(focus.x, focus.y);
      bgUniforms.uFocusAmount.value = Math.max(1 - dolly, state.toGlass * (1 - sp), mP, sR) * (1 - uniforms.uDisperse.value);
      bgUniforms.uTime.value = t * idle;
      bgUniforms.uScroll.value = state.scroll / viewH;
      bgUniforms.uTone.value = clamp(state.tone, 0, PALETTES.length - 1);
      updateSurveyMap(t);
      // the art deco line-work belongs to the vault section and moves with the scroll position
      bgUniforms.uDeco.value = smooth(clamp(1 - Math.abs(state.tone - VAULT) * 1.3));
      // vault section: no floating specks or dust — only the vault itself
      ambientUniforms.uAmount.value = 1 - bgUniforms.uDeco.value;
      uniforms.uQuiet.value = bgUniforms.uDeco.value;
      bgUniforms.uDecoT.value = state.scroll / viewH;
      // the ASL mark shows with the vault section and is gone once the camera is inside the vault
      // (it waits for the camera to come back out of the vault, and stays clear of the loader drive)
      updateLogo(bgUniforms.uDeco.value * w[2] * (1 - smooth(clamp((dolly - 0.2) / 0.4))));
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
      window.clearTimeout(mapTimer);
      (logoTexture as THREE.Texture | null)?.dispose();
      (mapTexture as THREE.CanvasTexture | null)?.dispose();
      ambientGeometry.dispose();
      (ambient.material as THREE.Material).dispose();
      momentum.dispose();
      solids.dispose();
      if (hasIdle) window.cancelIdleCallback(iconJob as number); else globalThis.clearTimeout(iconJob as ReturnType<typeof setTimeout>);
      iconPosTex.dispose();
      iconColTex.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      veilEl.remove();
      document.documentElement.classList.remove("gp-loader-on");
    };
  }, []);

  return <div ref={containerRef} className="gp-morph-scene" aria-hidden="true" />;
}
