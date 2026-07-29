import * as THREE from "three";
import { GOLDEN_ANGLE, mulberry32 } from "./math";
import type { LayoutName } from "./keyframes";

const PETAL_LENGTH = 1.35;
const PETAL_HALF = PETAL_LENGTH / 2;

/**
 * A single petal: a plane bent into a rounded, cupped blade with its base at
 * the origin, so every layout can treat the base as the pivot.
 */
export function createPetalGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.PlaneGeometry(1.15, PETAL_LENGTH, 6, 10);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    // 0 at the base of the petal, 1 at the tip. Clamped because float error at
    // the extremes can push this fractionally negative, and Math.pow of a
    // negative base with a fractional exponent is NaN.
    const v = THREE.MathUtils.clamp((y + PETAL_HALF) / PETAL_LENGTH, 0, 1);
    // A rounded blade rather than a spike: fat through the middle, falling off
    // quickly at both ends.
    const taper = Math.pow(Math.sin(Math.PI * v), 0.62);
    const nx = x * taper;
    // Cup across the width, and curl gently backwards along the length.
    const z = -0.3 * nx * nx - 0.16 * v * v;
    position.setXYZ(i, nx, y, z);
  }

  geometry.computeVertexNormals();
  geometry.translate(0, PETAL_HALF, 0);
  return geometry;
}

export type Layout = {
  positions: THREE.Vector3[];
  quaternions: THREE.Quaternion[];
  scales: number[];
};

const WORLD_UP = new THREE.Vector3(0, 1, 0);
const WORLD_FORWARD = new THREE.Vector3(0, 0, 1);

const basis = new THREE.Matrix4();
const tangent = new THREE.Vector3();
const binormal = new THREE.Vector3();
const spin = new THREE.Quaternion();

/**
 * Point a petal's length along `direction`, then spin it about its own axis by
 * `roll`. The basis is built explicitly rather than via setFromUnitVectors so
 * the twist is deterministic instead of whatever the shortest arc happens to be.
 */
function orient(
  direction: THREE.Vector3,
  roll: number,
  target: THREE.Quaternion,
): THREE.Quaternion {
  const up = direction.clone().normalize();
  const reference = Math.abs(up.y) > 0.985 ? WORLD_FORWARD : WORLD_UP;
  tangent.crossVectors(reference, up).normalize();
  binormal.crossVectors(up, tangent);
  basis.makeBasis(tangent, up, binormal);
  target.setFromRotationMatrix(basis);
  spin.setFromAxisAngle(WORLD_UP, roll);
  return target.multiply(spin);
}

function emptyLayout(count: number): Layout {
  return {
    positions: Array.from({ length: count }, () => new THREE.Vector3()),
    quaternions: Array.from({ length: count }, () => new THREE.Quaternion()),
    scales: new Array<number>(count).fill(1),
  };
}

/** Phyllotaxis dome — the bouquet. Petals stand up at the heart, lie flat at the rim. */
function buildBloom(count: number): Layout {
  const layout = emptyLayout(count);
  const direction = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const f = i / (count - 1);
    const radius = Math.sqrt(f) * 2.25;
    const angle = i * GOLDEN_ANGLE;

    layout.positions[i].set(
      Math.cos(angle) * radius,
      0.95 - Math.pow(radius, 1.85) * 0.4,
      Math.sin(angle) * radius,
    );

    const tilt = THREE.MathUtils.lerp(0.1, 1.3, Math.pow(f, 0.85));
    direction
      .set(Math.cos(angle), 0, Math.sin(angle))
      .multiplyScalar(Math.sin(tilt))
      .addScaledVector(WORLD_UP, Math.cos(tilt));

    orient(direction, angle, layout.quaternions[i]);
    layout.scales[i] = THREE.MathUtils.lerp(0.26, 0.52, f);
  }

  return layout;
}

/** A shrinking helix — the candle flame. */
function buildTaper(count: number): Layout {
  const layout = emptyLayout(count);
  const direction = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const f = i / (count - 1);
    // Tall and narrow. The bloom spreads the same petals over a wide disc, so
    // the column has to be generous vertically or the density reads as a blob
    // rather than a flame.
    const radius = 1.15 * Math.pow(1 - f, 0.62) + 0.04;
    // The extra f term twists the column as it rises.
    const angle = i * GOLDEN_ANGLE + f * 2.6;

    layout.positions[i].set(
      Math.cos(angle) * radius,
      -2.1 + f * 5.2,
      Math.sin(angle) * radius,
    );

    // Petals hug the surface, flaring out at the base and closing at the tip.
    direction
      .set(Math.cos(angle), 0, Math.sin(angle))
      .multiplyScalar(0.55 * Math.pow(1 - f, 1.5))
      .add(WORLD_UP);

    orient(direction, angle, layout.quaternions[i]);
    layout.scales[i] = THREE.MathUtils.lerp(0.42, 0.13, Math.pow(f, 0.8));
  }

  return layout;
}

/** Fibonacci sphere with petals facing outward — the tempered truffle. */
function buildOrb(count: number, rng: () => number): Layout {
  const layout = emptyLayout(count);
  const direction = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const f = (i + 0.5) / count;
    const y = 1 - 2 * f;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const angle = i * GOLDEN_ANGLE;

    direction.set(Math.cos(angle) * ring, y, Math.sin(angle) * ring).normalize();
    layout.positions[i]
      .copy(direction)
      .multiplyScalar(1.3 + (rng() - 0.5) * 0.16);

    orient(direction, angle, layout.quaternions[i]);
    layout.scales[i] = 0.28 + rng() * 0.07;
  }

  return layout;
}

/** A wide, loose cloud — the gift, given away. */
function buildDisperse(count: number, rng: () => number): Layout {
  const layout = emptyLayout(count);
  const direction = new THREE.Vector3();

  for (let i = 0; i < count; i += 1) {
    const angle = i * GOLDEN_ANGLE;
    const radius = 2.6 + rng() * 3.1;

    layout.positions[i].set(
      Math.cos(angle) * radius,
      (rng() - 0.5) * 4.2,
      Math.sin(angle) * radius,
    );

    direction
      .set(rng() - 0.5, rng() - 0.5, rng() - 0.5)
      .normalize();

    orient(direction, rng() * Math.PI * 2, layout.quaternions[i]);
    layout.scales[i] = 0.22 + rng() * 0.34;
  }

  return layout;
}

/**
 * All four layouts, precomputed once. Seeded so the scatter is identical on
 * every reload rather than shimmering on remount.
 */
export function buildLayouts(count: number): Record<LayoutName, Layout> {
  return {
    bloom: buildBloom(count),
    taper: buildTaper(count),
    orb: buildOrb(count, mulberry32(0x5eed)),
    disperse: buildDisperse(count, mulberry32(0xb100d)),
  };
}
