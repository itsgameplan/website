/**
 * Fixed topographic survey map for the Cairo Tech section, rendered once into
 * a canvas the background shader samples. Contours come from a deterministic
 * terrain (marching squares), so the map never changes once drawn. Every 50 m
 * contour is an index line labelled with its elevation.
 *
 * Channels (the shader tints them gold): R = contour lines, G = elevation labels, B = survey grid.
 */

const INTERVAL = 10;     // metres between contours
const INDEX_EVERY = 50;  // metres between labelled index contours
const REF_W = 1600;      // design width; everything scales from it

function hash(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function noise(x: number, y: number) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}
/** Terrain elevation in metres at normalised map position (u, v ∈ 0..1). */
function elevation(u: number, v: number, aspect: number) {
  let x = u * 3.1 + 11.3, y = v * 3.1 / aspect + 4.7;
  let e = 0, amp = 0.55;
  for (let o = 0; o < 3; o++) { e += amp * noise(x, y); x = x * 2.03 + 17.1; y = y * 2.03 + 9.2; amp *= 0.5; }
  const ridge = Math.exp(-((v - 0.42 - 0.12 * Math.sin(u * 4.0)) ** 2) / 0.05) * 0.35; // a broad ridge across the site
  return 20 + (e + ridge) * 190;
}

export function drawSurveyMap(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const s = width / REF_W;
  const aspect = width / height;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "lighter";

  // survey grid (B)
  ctx.strokeStyle = "rgb(0,0,255)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const g = 50 * s;
  for (let x = 0; x <= width; x += g) { ctx.moveTo(Math.round(x) + 0.5, 0); ctx.lineTo(Math.round(x) + 0.5, height); }
  for (let y = 0; y <= height; y += g) { ctx.moveTo(0, Math.round(y) + 0.5); ctx.lineTo(width, Math.round(y) + 0.5); }
  ctx.stroke();

  // sample the terrain
  const step = 12 * s;
  const cols = Math.ceil(width / step) + 1, rows = Math.ceil(height / step) + 1;
  const field = new Float32Array(cols * rows);
  let min = Infinity, max = -Infinity;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const e = elevation((i * step) / width, (j * step) / height, aspect);
    field[j * cols + i] = e;
    min = Math.min(min, e); max = Math.max(max, e);
  }

  const labels: { x: number; y: number; angle: number; text: string }[] = [];
  const t = (a: number, b: number, l: number) => (l - a) / (b - a);

  for (let level = Math.ceil(min / INTERVAL) * INTERVAL; level < max; level += INTERVAL) {
    const isIndex = level % INDEX_EVERY === 0;
    const segs: number[][] = [];
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const tl = field[j * cols + i], tr = field[j * cols + i + 1];
      const bl = field[(j + 1) * cols + i], br = field[(j + 1) * cols + i + 1];
      const code = (tl > level ? 8 : 0) | (tr > level ? 4 : 0) | (br > level ? 2 : 0) | (bl > level ? 1 : 0);
      if (code === 0 || code === 15) continue;
      const x = i * step, y = j * step;
      const top = [x + t(tl, tr, level) * step, y];
      const right = [x + step, y + t(tr, br, level) * step];
      const bottom = [x + t(bl, br, level) * step, y + step];
      const left = [x, y + t(tl, bl, level) * step];
      const add = (a: number[], b: number[]) => segs.push([a[0], a[1], b[0], b[1]]);
      switch (code) {
        case 1: case 14: add(left, bottom); break;
        case 2: case 13: add(bottom, right); break;
        case 3: case 12: add(left, right); break;
        case 4: case 11: add(top, right); break;
        case 6: case 9: add(top, bottom); break;
        case 7: case 8: add(left, top); break;
        case 5: add(left, top); add(bottom, right); break;
        case 10: add(left, bottom); add(top, right); break;
      }
    }
    // contour lines (R): index contours brighter and heavier
    ctx.strokeStyle = isIndex ? "rgb(255,0,0)" : "rgb(120,0,0)";
    ctx.lineWidth = (isIndex ? 2.0 : 1.1) * s;
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [a, b, c, d] of segs) { ctx.moveTo(a, b); ctx.lineTo(c, d); }
    ctx.stroke();

    if (isIndex && segs.length) {
      // a few well-spaced, upright labels per index contour
      let placed = 0;
      for (let k = Math.floor(segs.length * 0.11); k < segs.length && placed < 4; k += Math.max(1, Math.floor(segs.length / 7))) {
        const [a, b, c, d] = segs[k];
        const mx = (a + c) / 2, my = (b + d) / 2;
        if (mx < 90 * s || mx > width - 90 * s || my < 0.12 * height || my > 0.88 * height) continue;
        if (labels.some((l) => Math.hypot(l.x - mx, l.y - my) < 240 * s)) continue;
        let angle = Math.atan2(d - b, c - a);
        if (angle > Math.PI / 2) angle -= Math.PI;
        if (angle < -Math.PI / 2) angle += Math.PI;
        labels.push({ x: mx, y: my, angle, text: String(level) });
        placed++;
      }
    }
  }

  // elevation labels (G), knocked out of the contour they sit on
  ctx.font = `600 ${Math.round(14 * s)}px "IBM Plex Mono", monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const l of labels) {
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.rotate(l.angle);
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 9 * s;
    ctx.lineJoin = "round";
    ctx.strokeText(l.text, 0, 0);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = "rgb(0,255,0)";
    ctx.fillText(l.text, 0, 0);
    ctx.restore();
  }
  return canvas;
}
