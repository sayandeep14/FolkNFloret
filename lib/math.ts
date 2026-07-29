export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
export const TAU = Math.PI * 2;

/** Small, fast, seedable PRNG — keeps procedural scatter stable across reloads. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/**
 * Ease the keyframe parameter within each segment so the camera and the morph
 * settle into every chapter instead of sliding through at constant speed.
 * Integer stations are preserved exactly.
 */
export function easeKeyframeParam(u: number, max: number): number {
  const clamped = Math.min(Math.max(u, 0), max);
  const index = Math.floor(clamped);
  if (index >= max) return max;
  return index + smoothstep(clamped - index);
}

/** Frame-rate independent damping factor. */
export const damp = (delta: number, rate: number) => 1 - Math.exp(-delta * rate);
