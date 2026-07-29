import * as THREE from "three";

/**
 * One entry per camera keyframe. The page descends dawn -> morning -> flame ->
 * cocoa -> blue hour, following the colour progression in the production bible.
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
  /** Tint applied to the petals. */
  petal: THREE.Color;
  /** The light living inside the artifact — swells during The Flame. */
  core: THREE.Color;
  coreIntensity: number;
};

const c = (hex: string) => new THREE.Color(hex);

export const stops: Stop[] = [
  // 0 — Arrival. Misty cream dawn.
  {
    skyTop: c("#f9f3e9"),
    skyBottom: c("#e6d5c2"),
    key: c("#fff4e2"),
    keyIntensity: 2.4,
    fill: c("#f7f1e8"),
    fillIntensity: 0.9,
    petal: c("#f6e4e0"),
    core: c("#ffd9b0"),
    coreIntensity: 1.2,
  },
  // 1 — The Bouquet. Morning rose and botanical green.
  {
    skyTop: c("#f3e3da"),
    skyBottom: c("#cf9f96"),
    key: c("#ffe0cd"),
    keyIntensity: 2.6,
    fill: c("#e7cfc4"),
    fillIntensity: 0.85,
    petal: c("#e8b3b8"),
    core: c("#ffc48f"),
    coreIntensity: 2.0,
  },
  // 2 — The Flame. Golden hour collapses to candle amber.
  {
    skyTop: c("#4a2b2a"),
    skyBottom: c("#8a4a26"),
    key: c("#ffb25e"),
    keyIntensity: 2.2,
    fill: c("#6b3b2c"),
    fillIntensity: 0.55,
    petal: c("#f0c07a"),
    core: c("#ffa63c"),
    coreIntensity: 7.5,
  },
  // 3 — The Confection. Cocoa and plum.
  {
    skyTop: c("#241a1c"),
    skyBottom: c("#4e3129"),
    key: c("#d69a68"),
    keyIntensity: 2.0,
    fill: c("#3a2724"),
    fillIntensity: 0.5,
    petal: c("#a9736b"),
    core: c("#c98b5e"),
    coreIntensity: 4.0,
  },
  // 4 — The Gift. Blue hour, deep green, candlelight.
  {
    skyTop: c("#141d21"),
    skyBottom: c("#2f4a41"),
    key: c("#c6dccb"),
    keyIntensity: 1.7,
    fill: c("#20302d"),
    fillIntensity: 0.6,
    petal: c("#d8bfc9"),
    core: c("#ffbf7a"),
    coreIntensity: 5.0,
  },
  // 5 — Epilogue. Ink night behind the content sections.
  {
    skyTop: c("#0d1316"),
    skyBottom: c("#1d2b28"),
    key: c("#c3d8ca"),
    keyIntensity: 1.75,
    fill: c("#161f1e"),
    fillIntensity: 0.5,
    petal: c("#c9a8b4"),
    core: c("#e8a85c"),
    coreIntensity: 3.0,
  },
];

/**
 * Reusable scratch colour so per-frame sampling allocates nothing.
 * Pass a target in; the same instance is returned.
 */
export function sampleColor(
  key: "skyTop" | "skyBottom" | "key" | "fill" | "petal" | "core",
  u: number,
  target: THREE.Color,
): THREE.Color {
  const clamped = THREE.MathUtils.clamp(u, 0, stops.length - 1);
  const i = Math.floor(clamped);
  const j = Math.min(i + 1, stops.length - 1);
  return target.copy(stops[i][key]).lerp(stops[j][key], clamped - i);
}

export function sampleNumber(
  key: "keyIntensity" | "fillIntensity" | "coreIntensity",
  u: number,
): number {
  const clamped = THREE.MathUtils.clamp(u, 0, stops.length - 1);
  const i = Math.floor(clamped);
  const j = Math.min(i + 1, stops.length - 1);
  return THREE.MathUtils.lerp(stops[i][key], stops[j][key], clamped - i);
}
