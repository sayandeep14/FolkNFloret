import { CHAPTER_SPAN } from "./journey";

/**
 * A tiny mutable store shared between the DOM (GSAP/Lenis) and the WebGL
 * layer. Deliberately not React state: the canvas reads these values inside
 * useFrame every frame, and re-rendering the scene graph 60x a second would
 * be ruinous.
 */
export type ScrollState = {
  /** 0 -> 1 across the pinned journey. */
  journey: number;
  /** 0 -> 1 across the hand-off into the content below. */
  epilogue: number;
  /** Chapter parameter, 0 -> CHAPTER_SPAN. */
  u: number;
  /** Signed, normalised scroll velocity, roughly -1 -> 1. Drives distortion. */
  velocity: number;
  /** Pointer in 0 -> 1 UV space, eased. What the shaders actually read. */
  uvX: number;
  uvY: number;
  /** Raw pointer, -1 -> 1, for parallax. */
  pointerX: number;
  pointerY: number;
  /** How fast the pointer is moving, 0 -> 1. Drives the ripple strength. */
  pointerSpeed: number;
  /** Set once we know the device would rather we calmed down. */
  reducedMotion: boolean;
};

export const scrollState: ScrollState = {
  journey: 0,
  epilogue: 0,
  u: 0,
  velocity: 0,
  uvX: 0.5,
  uvY: 0.5,
  pointerX: 0,
  pointerY: 0,
  pointerSpeed: 0,
  reducedMotion: false,
};

export function syncChapterParam() {
  scrollState.u = scrollState.journey * CHAPTER_SPAN + scrollState.epilogue;
}
