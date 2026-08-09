/**
 * Hero orbit geometry — the single source of truth.
 *
 * The Figma mock and the site must agree, so the constants live here and nowhere
 * else. If you change one, re-run the Figma rebuild against these numbers.
 *
 * Cards ride one equatorial belt around a transparent sphere, viewed slightly
 * from above. The browser does the 3D on the compositor; these functions only
 * supply the per-card constants and the depth cues CSS cannot express.
 *
 *                    far side (dim, behind the wordmark)
 *                   ·  ·  ·  ·  ·  ·  ·  ·
 *              ·                            ·
 *          ·          ┌─────────┐             ·
 *   θ=270 ·           │ sphere  │              · θ=90
 *          ·          └─────────┘             ·
 *              ·                            ·
 *                   ▓  ▓  ▓ [θ=0] ▓  ▓  ▓
 *                    near side (full opacity)
 *
 * Perspective is real: proj = D / (D - R·cos θ). The near card is largest and
 * the belt bulges toward the viewer at the sides, which is what sells the depth.
 */

export const ORBIT = {
  /** Cards on the belt. Kept at 12 on every breakpoint (eng review D4). */
  COUNT: 12,
  /**
   * Orbit radius in design px. Mirrors --mm-orbit-r.
   *
   * This is what sets whether the belt reads as organised or as a pile. Twelve
   * 210px cards need more than 2520px of circumference to sit apart; at the old
   * 345px radius there was only 2168px, so adjacent cards overlapped by ~50px on
   * screen no matter what else was tuned. 470px opens a ~43px gap between the
   * front cards. Drop below about 435 and they start touching again.
   */
  RADIUS: 470,
  /**
   * Vertical semi-axis. The belt is an ellipse because we look down on it.
   * This is RADIUS * sin(12deg), the tilt the CSS actually applies.
   */
  RADIUS_Y: 98,
  /** Camera distance. Larger = flatter perspective. Mirrors the stage perspective. */
  DEPTH: 2200,
  /** Card width at the nearest point. */
  CARD_W: 210,
  /** Card height at the nearest point. */
  CARD_H: 192,
  /** Narrowest a card gets when edge-on, as a fraction of its width. */
  MIN_SQUASH: 0.2,
} as const;

/** Perspective factor at the nearest point, used to normalise scale to 1.0. */
const PROJ_FRONT = ORBIT.DEPTH / (ORBIT.DEPTH - ORBIT.RADIUS);

export interface OrbitSlot {
  index: number;
  /** Radians. 0 is nearest the viewer. */
  angle: number;
  /** Facing: +1 nearest, -1 furthest. */
  z: number;
  /** Uniform scale, 1.0 at the nearest point. */
  scale: number;
  /** Horizontal compression as the card turns edge-on. */
  squash: number;
  /** Screen offset from the sphere centre, design px. */
  x: number;
  y: number;
  /** Depth cue. Multiplied out so edge-on cards fade rather than read as slivers. */
  opacity: number;
}

/**
 * Project one card onto the belt.
 *
 * @param index card index, 0 to COUNT-1
 * @param spin  belt rotation in radians
 */
export function project(index: number, spin = 0): OrbitSlot {
  const angle = (index / ORBIT.COUNT) * Math.PI * 2 + spin;
  const z = Math.cos(angle);
  const proj = ORBIT.DEPTH / (ORBIT.DEPTH - ORBIT.RADIUS * z);
  const scale = proj / PROJ_FRONT;

  // 0 at the far side, 1 at the near side.
  const depth = (z + 1) / 2;
  // How square-on the card is. Edge-on cards fade so they read as depth, not artefacts.
  const facing = 0.22 + 0.78 * Math.sqrt(Math.abs(z));

  return {
    index,
    angle,
    z,
    scale,
    squash: ORBIT.MIN_SQUASH + (1 - ORBIT.MIN_SQUASH) * Math.abs(z),
    x: ORBIT.RADIUS * Math.sin(angle) * scale,
    y: ORBIT.RADIUS_Y * z,
    opacity: clamp((0.13 + 0.87 * depth ** 1.7) * facing, 0.04, 1),
  };
}

/** Every card, sorted back to front so painting order matches depth. */
export function projectAll(spin = 0): OrbitSlot[] {
  return Array.from({ length: ORBIT.COUNT }, (_, i) => project(i, spin)).sort(
    (a, b) => a.z - b.z,
  );
}

/** Belt rotation that brings `index` to the front. */
export function spinToFront(index: number): number {
  return -((index / ORBIT.COUNT) * Math.PI * 2);
}

/** Nearest card index for a given rotation. Used to snap after a drag. */
export function nearestIndex(spin: number): number {
  const step = (Math.PI * 2) / ORBIT.COUNT;
  return ((Math.round(-spin / step) % ORBIT.COUNT) + ORBIT.COUNT) % ORBIT.COUNT;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}
