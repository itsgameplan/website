/**
 * Scroll timeline of the pinned "We advise" chapter, shared by the copy (which item is showing)
 * and the particle scene (which icon the DNA strand has become), so the two never disagree.
 *
 * The section is tall and its content is sticky: `pinned` is how far it has scrolled while
 * pinned (0 → 1). The strand forms the first icon as the section arrives and steps through every
 * icon while pinned. The last icon stays formed: as the next chapter arrives, the scene's usual
 * stage morph carries it straight into the Cairo Tech loader.
 */
/** one icon per advisory service (lib/advise-icons.ts builds them; i18n `adviseItems` names them) */
export const ADVISE_ICON_COUNT = 7;

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smoothstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

/** strand → icon amount (0 … 1) and the continuous icon position q (0 … count-1) */
export function adviseTimeline(scrollY: number, top: number, height: number, viewH: number) {
  const pinLength = Math.max(1, height - viewH);
  const pinned = clamp((scrollY - top) / pinLength);
  const formIn = clamp((scrollY - (top - viewH * 0.55)) / (viewH * 0.55 + pinLength * 0.03));
  const q = clamp((pinned - 0.04) / 0.84) * (ADVISE_ICON_COUNT - 1);
  return { mix: formIn, q, pinned };
}

/** which two icons to blend and how far (each icon holds, then morphs into the next) */
export function adviseIconFrame(q: number) {
  const a = Math.min(ADVISE_ICON_COUNT - 2, Math.floor(q));
  const f = smoothstep(0.5, 0.95, q - a);
  return { a, b: a + 1, f, active: f > 0.5 ? a + 1 : a };
}
