import * as THREE from "three";

/**
 * One entry per camera keyframe.
 *
 * The whole piece is staged in a single dark room. Two earlier passes were
 * rejected: one travelled dawn pink -> amber -> cocoa -> botanical green, which
 * read as busy rather than rich; the second kept the value arc but opened on
 * alabaster against a pale ground, where the form had no separation and the
 * highlights blew out.
 *
 * So: near-black throughout, one luminous object, antique gold as the only
 * accent and only ever as light. The chapters are told apart by the form the
 * artifact takes, where the camera stands and what the lens is focused on —
 * never by recolouring the scene. It is lit like a museum vitrine, which is
 * also why the type can stay one colour from top to bottom.
 */
export type Stop = {
  /** Backdrop gradient, top and bottom. */
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  /** Key light. */
  key: THREE.Color;
  keyIntensity: number;
  /** Ambient fill. */
  fill: THREE.Color;
  fillIntensity: number;
  /** Surface colour of the petals. Stays within a hair of neutral throughout. */
  petal: THREE.Color;
  /** The light living inside the artifact — the one warm accent. */
  core: THREE.Color;
  coreIntensity: number;
  /** How strongly the studio environment reflects. Drives the porcelain read. */
  envIntensity: number;
};

const c = (hex: string) => new THREE.Color(hex);

export const stops: Stop[] = [
  // 0 — Arrival. The room at its most open.
  {
    skyTop: c("#2b2825"),
    skyBottom: c("#131211"),
    key: c("#fff6e8"),
    keyIntensity: 2.0,
    fill: c("#22201e"),
    fillIntensity: 0.36,
    petal: c("#f2ece2"),
    core: c("#ffe0b4"),
    coreIntensity: 1.0,
    envIntensity: 1.0,
  },
  // 1 — The Bouquet. Closer, and the key swings round.
  {
    skyTop: c("#262320"),
    skyBottom: c("#121110"),
    key: c("#fff2e2"),
    keyIntensity: 2.1,
    fill: c("#201e1c"),
    fillIntensity: 0.32,
    petal: c("#efe8dd"),
    core: c("#ffd9a8"),
    coreIntensity: 1.4,
    envIntensity: 1.05,
  },
  // 2 — The Flame. The light moves inside the form.
  {
    skyTop: c("#241f1a"),
    skyBottom: c("#100e0c"),
    key: c("#ffe3ba"),
    keyIntensity: 1.7,
    fill: c("#1d1916"),
    fillIntensity: 0.3,
    petal: c("#ecdfc9"),
    core: c("#ffc37c"),
    coreIntensity: 3.4,
    envIntensity: 0.9,
  },
  // 3 — The Confection. Deepest, tightest, warmest stone.
  {
    skyTop: c("#1e1b18"),
    skyBottom: c("#0d0c0b"),
    key: c("#e8d6bd"),
    keyIntensity: 1.7,
    fill: c("#191614"),
    fillIntensity: 0.3,
    petal: c("#d9cab6"),
    core: c("#dda872"),
    coreIntensity: 1.9,
    envIntensity: 0.85,
  },
  // 4 — The Gift. Cool key, warm centre, the form opening out.
  {
    skyTop: c("#191b1c"),
    skyBottom: c("#0c0d0e"),
    key: c("#dee2d8"),
    keyIntensity: 1.75,
    fill: c("#16181a"),
    fillIntensity: 0.32,
    petal: c("#e2d9cf"),
    core: c("#f0c68c"),
    coreIntensity: 2.4,
    envIntensity: 1.0,
  },
  // 5 — Epilogue. Resolves to the flat ink the content sections sit on.
  {
    skyTop: c("#0d0e10"),
    skyBottom: c("#0a0b0c"),
    key: c("#c9ccc3"),
    keyIntensity: 1.5,
    fill: c("#121315"),
    fillIntensity: 0.3,
    petal: c("#cec5bb"),
    core: c("#d9a96a"),
    coreIntensity: 1.5,
    envIntensity: 0.9,
  },
];

type ColorKey = "skyTop" | "skyBottom" | "key" | "fill" | "petal" | "core";
type NumberKey =
  | "keyIntensity"
  | "fillIntensity"
  | "coreIntensity"
  | "envIntensity";

/**
 * Reusable scratch colour so per-frame sampling allocates nothing.
 * Pass a target in; the same instance is returned.
 */
export function sampleColor(
  key: ColorKey,
  u: number,
  target: THREE.Color,
): THREE.Color {
  const clamped = THREE.MathUtils.clamp(u, 0, stops.length - 1);
  const i = Math.floor(clamped);
  const j = Math.min(i + 1, stops.length - 1);
  return target.copy(stops[i][key]).lerp(stops[j][key], clamped - i);
}

export function sampleNumber(key: NumberKey, u: number): number {
  const clamped = THREE.MathUtils.clamp(u, 0, stops.length - 1);
  const i = Math.floor(clamped);
  const j = Math.min(i + 1, stops.length - 1);
  return THREE.MathUtils.lerp(stops[i][key], stops[j][key], clamped - i);
}
