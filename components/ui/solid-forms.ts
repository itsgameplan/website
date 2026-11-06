import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  BALLS, BUCKET, DOOR_R, LOADER_PIVOT, VAULT_BARS, VAULT_HINGE,
  basketColor, footballColor, soccerColor, tennisColor, type MorphSet,
} from "@/lib/morph-shapes";

/**
 * Solid versions of the sport balls, wheel loader and vault. They are built
 * from the same dimensions as the particle forms and placed in the same
 * normalised space, so when the particles settle the solid can materialise in
 * exactly the same place (and keep doing the same scroll-driven motions).
 */

type V3 = [number, number, number];
type Reveal = { value: number };

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* Dissolve: solids materialise through 3D noise with a glowing edge    */
/* ------------------------------------------------------------------ */

const DISSOLVE_COMMON = /* glsl */ `
  varying vec3 vDissolvePos;
  uniform float uReveal;
  uniform vec3 uGlow;
  float dHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float dNoise(vec3 x) {
    vec3 i = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(dHash(i), dHash(i + vec3(1, 0, 0)), f.x), mix(dHash(i + vec3(0, 1, 0)), dHash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(dHash(i + vec3(0, 0, 1)), dHash(i + vec3(1, 0, 1)), f.x), mix(dHash(i + vec3(0, 1, 1)), dHash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }
`;

function dissolvable<T extends THREE.MeshStandardMaterial>(mat: T, reveal: Reveal, glow: THREE.Color): T {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uReveal = reveal;
    shader.uniforms.uGlow = { value: glow };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vDissolvePos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvDissolvePos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${DISSOLVE_COMMON}`)
      .replace("void main() {", `void main() {
        float dN = dNoise(vDissolvePos * 2.2) * 0.65 + dNoise(vDissolvePos * 7.0) * 0.35;
        float dEdge = uReveal * 1.12 - dN;
        if (dEdge < 0.0) discard;`)
      .replace("#include <opaque_fragment>", `
        outgoingLight += uGlow * (1.0 - smoothstep(0.0, 0.07, dEdge)) * (1.0 - step(0.999, uReveal)) * 2.5;
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => "gp-dissolve";
  return mat;
}

/* ------------------------------------------------------------------ */
/* Procedural textures                                                  */
/* ------------------------------------------------------------------ */

function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext("2d")!, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Equirectangular texture for THREE.SphereGeometry, evaluated from a direction → colour function. */
function sphereTexture(fn: (d: V3) => V3, w: number, h: number) {
  return canvasTexture(w, h, (ctx) => {
    const img = ctx.createImageData(w, h);
    for (let py = 0; py < h; py++) {
      const theta = Math.PI * (py + 0.5) / h;
      const st = Math.sin(theta), ct = Math.cos(theta);
      for (let px = 0; px < w; px++) {
        const phi = TAU * (px + 0.5) / w;
        const c = fn([-Math.cos(phi) * st, ct, Math.sin(phi) * st]);
        const o = (py * w + px) * 4;
        img.data[o] = Math.min(255, c[0] * 255);
        img.data[o + 1] = Math.min(255, c[1] * 255);
        img.data[o + 2] = Math.min(255, c[2] * 255);
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  });
}

const treadTexture = () => {
  const tex = canvasTexture(512, 64, (ctx, w, h) => {
    ctx.fillStyle = "#1c1f23"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#0c0e10";
    for (let x = -h; x < w + h; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0); ctx.lineTo(x + 14, 0); ctx.lineTo(x + 30, h / 2); ctx.lineTo(x + 14, h); ctx.lineTo(x, h); ctx.lineTo(x + 16, h / 2);
      ctx.fill();
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.set(2, 1);
  return tex;
};

const wheelFaceTexture = () => canvasTexture(256, 256, (ctx, w) => {
  const c = w / 2;
  const ring = (r: number, color: string) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(c, c, r * c, 0, TAU); ctx.fill(); };
  ring(1, "#1c1f23");
  ring(0.94, "#24282d");
  ring(0.58, "#15181b");
  ring(0.5, "#e8a720");
  ring(0.2, "#c98c12");
  ring(0.13, "#1d2328");
  ctx.fillStyle = "#1d2328";
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    ctx.beginPath(); ctx.arc(c + Math.cos(a) * 0.32 * c, c + Math.sin(a) * 0.32 * c, 0.035 * c, 0, TAU); ctx.fill();
  }
});

const grilleTexture = () => canvasTexture(128, 64, (ctx, w, h) => {
  ctx.fillStyle = "#c48d1d"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#14181b";
  for (let y = 6; y < h - 4; y += 9) ctx.fillRect(8, y, w - 16, 5);
});

const doorFaceTexture = () => canvasTexture(512, 512, (ctx, w) => {
  const c = w / 2;
  const grad = ctx.createRadialGradient(c * 0.8, c * 0.7, 0, c, c, c);
  grad.addColorStop(0, "#b7c1c8"); grad.addColorStop(1, "#7d8a94");
  ctx.fillStyle = grad; ctx.fillRect(0, 0, w, w);
  ctx.strokeStyle = "rgba(40,48,56,0.65)";
  for (let r = 0.2; r < 1; r += 0.2) { ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c, c, r * c, 0, TAU); ctx.stroke(); }
  ctx.lineWidth = 10; ctx.strokeStyle = "#48535c"; ctx.beginPath(); ctx.arc(c, c, c * 0.97, 0, TAU); ctx.stroke();
});

/* ------------------------------------------------------------------ */
/* Geometry helpers                                                     */
/* ------------------------------------------------------------------ */

function cylinderBetween(a: V3, b: V3, radius: number, mat: THREE.Material, segments = 24) {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, dir.length(), segments), mat);
  mesh.position.copy(va).add(vb).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

function beamBetween(a: [number, number], b: [number, number], z: number, thick: number, depth: number, mat: THREE.Material) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(Math.hypot(dx, dy) + thick, thick, depth, 3, Math.min(thick, depth) * 0.3), mat);
  mesh.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z);
  mesh.rotation.z = Math.atan2(dy, dx);
  return mesh;
}

function roundedBox(center: V3, size: V3, mat: THREE.Material, radius = 0.04) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size[0], size[1], size[2], 3, Math.min(radius, Math.min(...size) * 0.45)), mat);
  mesh.position.set(...center);
  return mesh;
}

/** Wraps design-space content so it lands in the particles' normalised space. */
function framed(frame: { center: V3; scale: number }) {
  const outer = new THREE.Group();
  const inner = new THREE.Group();
  inner.scale.setScalar(frame.scale);
  inner.position.set(-frame.center[0] * frame.scale, -frame.center[1] * frame.scale, -frame.center[2] * frame.scale);
  outer.add(inner);
  return { outer, inner };
}

/* ------------------------------------------------------------------ */
/* Builders                                                             */
/* ------------------------------------------------------------------ */

export function createSolidForms(targets: MorphSet) {
  const reveal = { sports: { value: 0 }, loader: { value: 0 }, vault: { value: 0 } };
  const disposables: { dispose(): void }[] = [];
  const track = <T extends { dispose(): void }>(x: T) => { disposables.push(x); return x; };
  const mat = (form: keyof typeof reveal, params: THREE.MeshStandardMaterialParameters, glow = 0xffd28a) =>
    track(dissolvable(new THREE.MeshStandardMaterial(params), reveal[form], new THREE.Color(glow)));

  /* ---- 02 sport balls ---- */
  const sports = new THREE.Group();
  const sf = targets.frames.sports;
  const toNorm = (c: V3) => new THREE.Vector3((c[0] - sf.center[0]) * sf.scale, (c[1] - sf.center[1]) * sf.scale, (c[2] - sf.center[2]) * sf.scale);
  type Ball = { group: THREE.Group; home: THREE.Vector3; spin: number };
  const balls: Ball[] = [];
  const ballGeo = track(new THREE.SphereGeometry(1, 96, 64));
  const addBall = (centre: V3, colour: (d: V3) => V3, texW: number, params: THREE.MeshStandardMaterialParameters, glow: number, shape: (m: THREE.Mesh) => THREE.Object3D) => {
    const mesh = new THREE.Mesh(ballGeo, mat("sports", { map: track(sphereTexture(colour, texW, texW / 2)), ...params }, glow));
    const group = new THREE.Group();
    const home = toNorm(centre);
    group.scale.setScalar(sf.scale);
    group.add(shape(mesh));
    sports.add(group);
    // same per-ball spin speed as the particle shader
    const l = home.length() * 3.7;
    balls.push({ group, home, spin: 1.6 + (l - Math.floor(l)) * 1.4 });
  };
  const sized = (r: number) => (m: THREE.Mesh) => { m.scale.setScalar(r); return m; };
  addBall(BALLS.soccer.center, soccerColor, 1024, { roughness: 0.38 }, 0xfff1d6, sized(BALLS.soccer.radius));
  addBall(BALLS.basket.center, basketColor, 1024, { roughness: 0.72 }, 0xffb070, sized(BALLS.basket.radius));
  addBall(BALLS.tennis.center, tennisColor, 512, { roughness: 1.0 }, 0xf2ff9a, sized(BALLS.tennis.radius));
  addBall(BALLS.football.center, footballColor, 1024, { roughness: 0.55 }, 0xffc58a, (m) => {
    m.scale.set(...BALLS.football.radii);
    const tilt = new THREE.Group();
    tilt.rotation.z = BALLS.football.tilt;
    tilt.add(m);
    return tilt;
  });

  /* ---- 03 wheel loader ---- */
  const lf = framed(targets.frames.loader);
  const loader = lf.outer;
  const L = lf.inner;
  const paint = mat("loader", { color: 0xf3b52c, roughness: 0.38, metalness: 0.25 });
  const paintDark = mat("loader", { color: 0xcf9420, roughness: 0.45, metalness: 0.25 });
  const frame = mat("loader", { color: 0x1d2328, roughness: 0.6, metalness: 0.4 });
  const steel = mat("loader", { color: 0x9aa6af, roughness: 0.25, metalness: 0.95 });
  const glass = mat("loader", { color: 0x1e3946, roughness: 0.06, metalness: 0.6 });
  const tread = mat("loader", { map: track(treadTexture()), roughness: 0.92, metalness: 0.0 });
  const wheelFace = mat("loader", { map: track(wheelFaceTexture()), roughness: 0.7, metalness: 0.2 });
  const grille = mat("loader", { map: track(grilleTexture()), roughness: 0.5, metalness: 0.3 });

  const tyreGeo = track(new THREE.CylinderGeometry(0.52, 0.52, 0.36, 48));
  for (const x of [-1.15, 0.78]) for (const z of [-0.66, 0.66]) {
    const tyre = new THREE.Mesh(tyreGeo, [tread, wheelFace, wheelFace]);
    tyre.rotation.x = Math.PI / 2;
    tyre.position.set(x, -0.55, z);
    L.add(tyre);
  }
  L.add(roundedBox([-1.05, -0.12, 0], [1.55, 0.5, 0.92], paint));
  L.add(roundedBox([-1.35, 0.3, 0], [0.95, 0.36, 0.84], paint));
  const grillePlate = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.28), grille);
  grillePlate.rotation.y = -Math.PI / 2;
  grillePlate.position.set(-1.35 - 0.476, 0.3, 0);
  L.add(grillePlate);
  L.add(roundedBox([-1.9, -0.12, 0], [0.18, 0.62, 1.0], paintDark));
  L.add(cylinderBetween([-1.55, 0.44, 0.28], [-1.55, 0.9, 0.28], 0.05, frame));
  L.add(roundedBox([0.5, -0.24, 0], [1.05, 0.38, 0.72], paint));
  // cab: dark glass with frame pillars and a yellow roof
  L.add(roundedBox([-0.22, 0.62, 0], [0.84, 0.93, 0.88], glass, 0.02));
  for (const px of [-0.22 - 0.4, -0.22 + 0.4]) for (const pz of [-0.42, 0.42]) L.add(roundedBox([px, 0.62, pz], [0.07, 0.95, 0.07], frame, 0.02));
  L.add(roundedBox([-0.22, 0.17, 0], [0.88, 0.07, 0.92], frame, 0.02));
  L.add(roundedBox([-0.22, 1.13, 0], [1.0, 0.07, 1.02], paint, 0.03));

  // lift arm assembly rotates about the pivot, exactly like the tagged particles
  const armPivot = new THREE.Group();
  armPivot.position.set(LOADER_PIVOT[0], LOADER_PIVOT[1], 0);
  const arm = new THREE.Group();
  arm.position.set(-LOADER_PIVOT[0], -LOADER_PIVOT[1], 0);
  armPivot.add(arm);
  L.add(armPivot);
  for (const z of [-0.4, 0.4]) {
    arm.add(beamBetween(LOADER_PIVOT, [1.6, -0.2], z, 0.2, 0.14, paint));
    arm.add(cylinderBetween([0.35, -0.22, z * 0.6], [1.15, 0.1, z * 0.6], 0.06, steel));
  }
  arm.add(cylinderBetween([0.62, 0.0, -0.4], [0.62, 0.0, 0.4], 0.07, paint)); // cross tube
  const { p0, p1, p2, W } = BUCKET;
  const curve = (t: number): [number, number] => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1],
  ];
  {
    const N = 40;
    const verts: number[] = [];
    const idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const [x, y] = curve(i / N);
      verts.push(x, y, -W, x, y, W);
      if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
    const scoop = new THREE.BufferGeometry();
    scoop.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    scoop.setIndex(idx);
    scoop.computeVertexNormals();
    track(scoop);
    const bucketPaint = mat("loader", { color: 0xf3b52c, roughness: 0.42, metalness: 0.25, side: THREE.DoubleSide });
    arm.add(new THREE.Mesh(scoop, bucketPaint));
    const shape = new THREE.Shape();
    shape.moveTo(p0[0], p0[1]);
    for (let i = 1; i <= N; i++) { const [x, y] = curve(i / N); shape.lineTo(x, y); }
    shape.lineTo(p0[0], p0[1]);
    const plateGeo = track(new THREE.ShapeGeometry(shape));
    for (const z of [-W, W]) { const plate = new THREE.Mesh(plateGeo, bucketPaint); plate.position.z = z; arm.add(plate); }
    arm.add(cylinderBetween([p2[0], p2[1], -W - 0.02], [p2[0], p2[1], W + 0.02], 0.045, steel));
  }

  /* ---- 04 vault ---- */
  const vf = framed(targets.frames.vault);
  const vault = vf.outer;
  const V = vf.inner;
  const body = mat("vault", { color: 0x5f6d79, roughness: 0.34, metalness: 0.85 });
  const inner = mat("vault", { color: 0x161c22, roughness: 0.8, metalness: 0.3, side: THREE.DoubleSide });
  const gold = mat("vault", { color: 0xe3ad4f, roughness: 0.22, metalness: 1.0 }, 0xfff0b0);
  const bar = mat("vault", { color: 0xf3c35c, roughness: 0.16, metalness: 1.0 }, 0xfff0b0);
  const doorSide = mat("vault", { color: 0x6c7882, roughness: 0.3, metalness: 0.9 });
  const doorFront = mat("vault", { map: track(doorFaceTexture()), roughness: 0.28, metalness: 0.85 });
  const doorBack = mat("vault", { color: 0x3a444c, roughness: 0.5, metalness: 0.7 });

  {
    const outline = new THREE.Shape();
    outline.moveTo(-1.31, -1.41); outline.lineTo(1.31, -1.41); outline.lineTo(1.31, 1.41); outline.lineTo(-1.31, 1.41); outline.lineTo(-1.31, -1.41);
    const hole = new THREE.Path();
    hole.absarc(0, 0, DOOR_R + 0.06, 0, TAU, true);
    outline.holes.push(hole);
    const bodyGeo = track(new THREE.ExtrudeGeometry(outline, { depth: 1.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 96 }));
    const shell = new THREE.Mesh(bodyGeo, body);
    shell.position.z = -1.06;
    V.add(shell);
  }
  const cavity = new THREE.Mesh(track(new THREE.CylinderGeometry(DOOR_R + 0.055, DOOR_R + 0.055, 1.26, 96, 1, true)), inner);
  cavity.rotation.x = Math.PI / 2;
  cavity.position.z = -0.45;
  V.add(cavity);
  const back = new THREE.Mesh(track(new THREE.CircleGeometry(DOOR_R + 0.07, 96)), inner);
  back.position.z = -1.06;
  V.add(back);
  for (const c of VAULT_BARS) V.add(roundedBox(c, [0.44, 0.15, 0.6], bar, 0.025));
  const frameRing = new THREE.Mesh(track(new THREE.TorusGeometry(DOOR_R + 0.1, 0.06, 16, 120)), gold);
  frameRing.position.z = 0.22;
  V.add(frameRing);
  for (const y of [-0.62, 0.62]) {
    const hinge = new THREE.Mesh(track(new THREE.CylinderGeometry(0.085, 0.085, 0.42, 24)), gold);
    hinge.position.set(VAULT_HINGE[0], y, VAULT_HINGE[1]);
    V.add(hinge);
  }
  // door swings about the hinge; the handle spins about the hub — same transforms as the particles
  const doorPivot = new THREE.Group();
  doorPivot.position.set(VAULT_HINGE[0], 0, VAULT_HINGE[1]);
  const door = new THREE.Group();
  door.position.set(-VAULT_HINGE[0], 0, -VAULT_HINGE[1]);
  doorPivot.add(door);
  V.add(doorPivot);
  const slab = new THREE.Mesh(track(new THREE.CylinderGeometry(DOOR_R, DOOR_R, 0.26, 96)), [doorSide, doorFront, doorBack]);
  slab.rotation.x = Math.PI / 2;
  slab.position.z = 0.36;
  door.add(slab);
  const boltGeo = track(new THREE.SphereGeometry(0.055, 16, 12));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    const bolt = new THREE.Mesh(boltGeo, gold);
    bolt.position.set(Math.cos(a) * 0.9, Math.sin(a) * 0.9, 0.5);
    door.add(bolt);
  }
  const handle = new THREE.Group();
  door.add(handle);
  const hub = new THREE.Mesh(track(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 32)), gold);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.6;
  handle.add(hub);
  const knobGeo = track(new THREE.SphereGeometry(0.065, 16, 12));
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    const end: V3 = [Math.cos(a) * 0.6, Math.sin(a) * 0.6, 0.66];
    handle.add(cylinderBetween([Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0.66], end, 0.035, gold, 12));
    const knob = new THREE.Mesh(knobGeo, gold);
    knob.position.set(...end);
    handle.add(knob);
  }

  // collect geometries created inline so they are disposed too
  for (const root of [sports, loader, vault]) {
    root.traverse((o) => { if (o instanceof THREE.Mesh) disposables.push(o.geometry); });
    root.visible = false;
  }

  function update(s: { reveal: [number, number, number]; apart: number; lift: number; spin: number; door: number }) {
    reveal.sports.value = s.reveal[0];
    reveal.loader.value = s.reveal[1];
    reveal.vault.value = s.reveal[2];
    sports.visible = s.reveal[0] > 0.002;
    loader.visible = s.reveal[1] > 0.002;
    vault.visible = s.reveal[2] > 0.002;

    // balls drift apart and spin (mirrors sportsPos() in the particle shader)
    for (const b of balls) {
      b.group.position.copy(b.home).multiplyScalar(1 + s.apart * 0.85);
      b.group.position.z += s.apart * 0.35;
      b.group.rotation.y = s.apart * b.spin;
    }
    armPivot.rotation.z = s.lift;
    handle.rotation.z = s.spin;
    doorPivot.rotation.y = -s.door;
  }

  return {
    sports,
    loader,
    vault,
    update,
    dispose() { new Set(disposables).forEach((d) => d.dispose()); },
  };
}
