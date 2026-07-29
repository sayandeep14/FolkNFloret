import * as THREE from "three";

const PETAL_LENGTH = 1.35;
const PETAL_HALF = PETAL_LENGTH / 2;

/**
 * A single petal: a plane bent into a rounded, cupped blade with its base at
 * the origin, so it pivots correctly however it is placed.
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
