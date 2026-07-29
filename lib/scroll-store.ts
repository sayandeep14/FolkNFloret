/**
 * A tiny mutable store shared between the DOM (GSAP/Lenis) and the WebGL
 * layer. Deliberately not React state: the canvas reads these values inside
 * useFrame every frame, and re-rendering the scene graph 60x a second would
 * be ruinous.
 */
export type ScrollState = {
  /** 0 -> 1 across the pinned journey. */
  journey: number;
  /** 0 -> 1 across everything after the journey releases. */
  epilogue: number;
  /** Camera keyframe parameter, 0 -> KEYFRAME_COUNT - 1. */
  u: number;
  /** Signed, normalised scroll velocity, roughly -1 -> 1. */
  velocity: number;
  /** Normalised pointer, -1 -> 1 on both axes. */
  pointerX: number;
  pointerY: number;
  /** Set once we know the device would rather we calmed down. */
  reducedMotion: boolean;
};

/**
 * Resolved at module load, not in an effect. React runs child effects before
 * parent ones, so components that read this during their own effect would
 * otherwise see the default before SmoothScroll had a chance to set it.
 */
function initialReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const scrollState: ScrollState = {
  journey: 0,
  epilogue: 0,
  u: 0,
  velocity: 0,
  pointerX: 0,
  pointerY: 0,
  reducedMotion: initialReducedMotion(),
};

/** Journey covers keyframes 0..4, the epilogue eases on to keyframe 5. */
export const JOURNEY_SPAN = 4;

export function syncCameraParam() {
  scrollState.u = scrollState.journey * JOURNEY_SPAN + scrollState.epilogue;
}
