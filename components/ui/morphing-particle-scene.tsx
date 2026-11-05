"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createMorphTargets, type FormName } from "@/lib/morph-shapes";

type SceneProps = { labels: readonly [string, string, string, string]; hoverHint: string };
const FORMS: FormName[] = ["origin", "sports", "loader", "vault"];
const SECTION_IDS = ["home", "about", "ventures", "advisory"];
const LIGHT_SECTIONS = ["ventures"];

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt));

/* Per-form framing: orientation of the model once each shape has settled. */
const POSE = [
  { rx: 0.08, ry: 0.0, scale: 1.0 },
  { rx: 0.1, ry: -0.28, scale: 1.0 },
  { rx: 0.2, ry: -0.62, scale: 1.0 },
  { rx: 0.08, ry: 0.36, scale: 0.98 },
];

const vertexShader = /* glsl */ `
  attribute vec3 aPos1;
  attribute vec3 aPos2;
  attribute vec3 aPos3;
  attribute vec3 aCol0;
  attribute vec3 aCol1;
  attribute vec3 aCol2;
  attribute vec3 aCol3;
  attribute vec2 aMeta; // x: random seed, y: part tag

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
  uniform vec2 uPointer;
  uniform vec2 uHinge;
  uniform vec2 uHub;

  varying vec3 vColor;
  varying float vAlpha;

  vec3 rotY(vec3 p, float a) { float c = cos(a), s = sin(a); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
  vec3 hash3(float n) { return fract(sin(vec3(n, n + 1.7, n + 3.1) * vec3(43758.5453, 22578.1459, 19642.349))); }

  vec3 vaultPos() {
    vec3 p = aPos3;
    float part = aMeta.y;
    if (part > 1.5 && part < 2.5) {
      vec2 d = p.xy - uHub;
      float c = cos(uSpin), s = sin(uSpin);
      p.xy = uHub + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
    }
    if (part > 0.5 && part < 2.5) {
      vec3 h = vec3(uHinge.x, p.y, uHinge.y);
      p = h + rotY(p - h, -uDoor);
    }
    return p;
  }
  vec3 posAt(float k) {
    if (k < 0.5) return rotY(position, uTime * 0.16 * uIdle);
    if (k < 1.5) return aPos1;
    if (k < 2.5) return aPos2;
    return vaultPos();
  }
  vec3 colAt(float k) {
    if (k < 0.5) return aCol0;
    if (k < 1.5) return aCol1;
    if (k < 2.5) return aCol2;
    return aCol3;
  }

  void main() {
    float st = clamp(uStage, 0.0, 3.0);
    float i = min(floor(st), 2.0);
    float f = st - i;
    vec3 A = posAt(i);
    vec3 B = posAt(i + 1.0);
    float r = aMeta.x;

    // staggered wave: particles on the left leave first, with a little randomness
    float sweep = clamp(0.5 + A.x * 0.16 + (r - 0.5) * 0.45, 0.0, 1.0);
    float e = clamp(f * 1.8 - sweep * 0.8, 0.0, 1.0);
    e = e * e * e * (e * (e * 6.0 - 15.0) + 10.0);
    float arc = sin(3.14159265 * e);

    vec3 dir = normalize(hash3(r * 91.7) - 0.5 + 1e-4);
    vec3 p = mix(A, B, e);
    p += (dir * 0.55 + normalize(p + 1e-4) * 0.3) * arc * uSpread;
    p += vec3(sin(uTime * 1.3 + r * 40.0), cos(uTime * 1.1 + r * 31.0), sin(uTime * 0.9 + r * 17.0)) * (0.07 * arc + 0.006 * uIdle);

    // intro assembly from a scattered cloud
    float ie = clamp(uIntro * 1.5 - r * 0.5, 0.0, 1.0);
    ie = 1.0 - pow(1.0 - ie, 3.0);
    p = mix(dir * (3.2 + r * 2.4), p, ie);

    bool dust = aMeta.y > 2.5;
    if (dust) p = rotY(p, uTime * 0.03 * uIdle);
    p += dir * uDisperse * (1.2 + r * 1.8);

    vec4 world = modelMatrix * vec4(p, 1.0);
    vec2 d = world.xy - uPointer;
    float infl = uHover * exp(-dot(d, d) / 0.5);
    world.xy += normalize(d + 1e-4) * infl * 0.5;
    world.z += infl * 0.45;

    vec4 mv = viewMatrix * world;
    gl_Position = projectionMatrix * mv;
    float size = uSize * (dust ? 0.75 : 1.0) * (0.85 + r * 0.3) * (1.0 + arc * 0.25);
    gl_PointSize = clamp(size * uScale / -mv.z, 1.0, 14.0);

    vColor = mix(colAt(i), colAt(i + 1.0), e) * (1.0 + infl * 0.35);
    vAlpha = (dust ? 0.4 : 1.0) * (1.0 - uDisperse) * ie;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  uniform float uOnLight;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float a = smoothstep(0.5, 0.36, r) * vAlpha * uOpacity;
    if (a < 0.35) discard;
    vec3 col = vColor * (1.0 - r * 0.45) * mix(1.0, 0.86, uOnLight);
    gl_FragColor = vec4(col, a);
  }
`;

/** One particle system, four sampled 3D forms; every morph runs on the GPU. */
export function MorphingParticleScene({ labels, hoverHint }: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = document.getElementById("gp-morph-track");
    if (!container || !track) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      if (fallbackRef.current) fallbackRef.current.hidden = false;
      return;
    }

    const mobile = window.innerWidth < 700;
    const count = mobile ? 11000 : 22000;
    const targets = createMorphTargets(count);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(targets.origin.positions, 3));
    geometry.setAttribute("aPos1", new THREE.BufferAttribute(targets.sports.positions, 3));
    geometry.setAttribute("aPos2", new THREE.BufferAttribute(targets.loader.positions, 3));
    geometry.setAttribute("aPos3", new THREE.BufferAttribute(targets.vault.positions, 3));
    FORMS.forEach((form, k) => geometry.setAttribute(`aCol${k}`, new THREE.BufferAttribute(targets[form].colors, 3)));
    const meta = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      meta[i * 2] = ((i * 0.61803398875) % 1 + Math.sin(i * 12.9898) * 0.0001 + 1) % 1;
      meta[i * 2 + 1] = targets.parts[i];
    }
    geometry.setAttribute("aMeta", new THREE.BufferAttribute(meta, 2));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 8);

    const uniforms = {
      uStage: { value: 0 },
      uTime: { value: 0 },
      uIntro: { value: reducedMotion ? 1 : 0 },
      uDisperse: { value: 0 },
      uSpread: { value: 1 },
      uDoor: { value: 0 },
      uSpin: { value: 0 },
      uSize: { value: mobile ? 0.06 : 0.046 },
      uScale: { value: 500 },
      uHover: { value: 0 },
      uIdle: { value: reducedMotion ? 0 : 1 },
      uPointer: { value: new THREE.Vector2(99, 99) },
      uHinge: { value: new THREE.Vector2(...targets.vaultHinge) },
      uHub: { value: new THREE.Vector2(...targets.vaultHub) },
      uOpacity: { value: 1 },
      uOnLight: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: true, depthTest: true });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;

    const scene = new THREE.Scene();
    const model = new THREE.Group();
    model.add(points);
    scene.add(model);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.className = "gp-morph-canvas";
    container.prepend(renderer.domElement);

    /* ---- layout ---- */
    let anchors = [0, 1, 2, 3];
    let doorStart = 4;
    let viewH = window.innerHeight;
    const drawSize = new THREE.Vector2();

    function docTop(el: HTMLElement) {
      return el.getBoundingClientRect().top + window.scrollY;
    }
    function resize() {
      const rect = container!.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      viewH = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
      camera.position.set(0, 0, 2.25 / Math.sin(Math.min(vfov, hfov) / 2));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.getDrawingBufferSize(drawSize);
      uniforms.uScale.value = drawSize.y / (2 * Math.tan(vfov / 2));
      anchors = SECTION_IDS.map((id) => {
        const el = document.getElementById(id);
        return el ? docTop(el) : 0;
      });
      doorStart = anchors[3];
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resizeObserver.observe(track);
    window.addEventListener("resize", resize, { passive: true });

    /* ---- scroll → targets ---- */
    function readScroll() {
      const y = window.scrollY;
      let stage = 0;
      // each morph plays while the next section rises from 85% to 20% of the viewport
      for (let k = 1; k < 4; k++) stage += clamp((y - (anchors[k] - viewH * 0.85)) / (viewH * 0.65));
      const door = clamp((y - (doorStart - viewH * 0.05)) / (viewH * 0.55));
      const trackBottom = track!.getBoundingClientRect().bottom;
      const visible = clamp((trackBottom - viewH * 0.05) / (viewH * 0.45));
      const mid = container!.getBoundingClientRect();
      const centerY = mid.top + mid.height / 2;
      let light = 0;
      for (const id of LIGHT_SECTIONS) {
        const r = document.getElementById(id)?.getBoundingClientRect();
        if (r) light = Math.max(light, clamp((centerY - r.top) / 160) * clamp((r.bottom - centerY) / 160));
      }
      return { stage, door, visible, light };
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
      const rect = container!.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width;
      const ny = (event.clientY - rect.top) / rect.height;
      targetParX = clamp(event.clientX / window.innerWidth, 0, 1) - 0.5;
      targetParY = clamp(event.clientY / window.innerHeight, 0, 1) - 0.5;
      pointerInside = nx > 0.05 && nx < 0.95 && ny > 0.05 && ny < 0.95;
      ndc.set(nx * 2 - 1, -(ny * 2 - 1));
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, hit)) uniforms.uPointer.value.set(hit.x, hit.y);
    };
    const onPointerLeave = () => { pointerInside = false; targetParX = targetParY = 0; };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    /* ---- loop ---- */
    const initial = readScroll();
    const state = { stage: initial.stage, door: initial.door, visible: initial.visible, light: initial.light, hover: 0 };
    let lastStage = -1;
    let lastTone = "";
    let raf = 0;
    let last = performance.now();
    const start = last;

    function applyHud(stage: number, light: number) {
      const active = Math.min(3, Math.round(stage));
      if (active !== lastStage) {
        lastStage = active;
        if (captionRef.current) captionRef.current.textContent = labels[active];
        if (counterRef.current) counterRef.current.textContent = String(active + 1);
        container!.dataset.scene = FORMS[active];
      }
      const tone = light > 0.5 ? "light" : "dark";
      if (tone !== lastTone) { lastTone = tone; container!.dataset.tone = tone; }
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const target = readScroll();

      if (reducedMotion) {
        state.stage = Math.round(target.stage);
        state.door = target.door > 0.5 ? 1 : 0;
        state.visible = target.visible;
        state.light = target.light;
      } else {
        const gap = Math.abs(target.stage - state.stage);
        state.stage = damp(state.stage, target.stage, 4.2, dt);
        state.door = damp(state.door, target.door, 3.5, dt);
        state.visible = damp(state.visible, target.visible, 6, dt);
        state.light = damp(state.light, target.light, 5, dt);
        state.hover = damp(state.hover, pointerInside ? 1 : 0, 5, dt);
        uniforms.uSpread.value = damp(uniforms.uSpread.value, 1 + Math.min(gap * 0.9, 0.9), 3, dt);
        uniforms.uIntro.value = clamp(t / 2.6);
        parallaxX = damp(parallaxX, targetParX, 2.5, dt);
        parallaxY = damp(parallaxY, targetParY, 2.5, dt);
      }

      container!.style.opacity = clamp(state.visible * 1.4).toFixed(3);
      applyHud(state.stage, state.light);

      if (state.visible > 0.002) {
        const s = clamp(state.stage, 0, 3);
        const i = Math.min(2, Math.floor(s));
        const f = s - i;
        const eased = smooth(clamp((f - 0.15) / 0.7));
        const a = POSE[i], b = POSE[i + 1];
        const twirl = Math.sin(Math.PI * eased) * 0.9;
        const idle = reducedMotion ? 0 : 1;
        model.rotation.y = a.ry + (b.ry - a.ry) * eased + twirl + Math.sin(t * 0.22) * 0.14 * idle + parallaxX * 0.35;
        model.rotation.x = a.rx + (b.rx - a.rx) * eased + Math.sin(t * 0.17) * 0.04 * idle + parallaxY * 0.18;
        model.position.y = Math.sin(t * 0.6) * 0.05 * idle;
        model.scale.setScalar(a.scale + (b.scale - a.scale) * eased);

        // vault: unlock the handle, then swing the door open
        uniforms.uSpin.value = smooth(clamp(state.door / 0.4)) * Math.PI * 1.25;
        uniforms.uDoor.value = smooth(clamp((state.door - 0.3) / 0.7)) * 1.75;

        uniforms.uStage.value = s;
        uniforms.uTime.value = t;
        uniforms.uHover.value = state.hover;
        uniforms.uDisperse.value = 1 - smooth(clamp(state.visible));
        uniforms.uOpacity.value = 1;
        uniforms.uOnLight.value = state.light;
        renderer.render(scene, camera);
      }
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

    return () => {
      cancelAnimationFrame(raf);
      if (onStaticScroll) window.removeEventListener("scroll", onStaticScroll);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [labels]);

  return <div ref={containerRef} className="gp-morph-scene" data-scene="origin" data-tone="dark" aria-hidden="true">
    <div className="gp-morph-glow" />
    <div className="gp-morph-hud">
      <span className="gp-morph-hud-index">GP / FORM 0<span ref={counterRef}>1</span> — 04</span>
      <span ref={captionRef}>{labels[0]}</span>
    </div>
    <span className="gp-morph-hover-hint">{hoverHint}</span>
    <div ref={fallbackRef} className="gp-morph-fallback" hidden />
  </div>;
}
