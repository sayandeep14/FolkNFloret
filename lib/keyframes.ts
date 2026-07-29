import * as THREE from "three";

export type Keyframe = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  /** Radians of dutch roll applied after lookAt. */
  roll: number;
};

/**
 * Six stations for the camera. Positions are threaded onto a Catmull-Rom curve
 * so the flight between them arcs rather than cutting a straight line — that
 * curvature is most of what makes the movement read as choreographed.
 */
/**
 * Distances are set so the artifact reads as an object in a frame rather than a
 * texture across it — the copy occupies the left third, so every target is
 * pushed left of origin to compose the form into the right.
 */
export const keyframes: Keyframe[] = [
  // 0 — Arrival. High and back, looking down onto the open bloom.
  {
    position: new THREE.Vector3(0.4, 2.9, 10.5),
    target: new THREE.Vector3(-1.5, 0.1, 0),
    fov: 34,
    roll: 0,
  },
  // 1 — The Bouquet. Dropped low and swung round to the right.
  {
    position: new THREE.Vector3(5.8, -0.7, 7.4),
    target: new THREE.Vector3(-1.1, 0.3, 0),
    fov: 40,
    roll: -0.05,
  },
  // 2 — The Flame. Crosses to the left and climbs as the column forms.
  {
    position: new THREE.Vector3(-4.8, 2.6, 8.2),
    target: new THREE.Vector3(-1.3, 0.6, 0),
    fov: 36,
    roll: 0.07,
  },
  // 3 — The Confection. Closest hold of the journey, tight on the orb.
  {
    position: new THREE.Vector3(2.1, 0.5, 4.4),
    target: new THREE.Vector3(-0.9, 0.05, 0),
    fov: 32,
    roll: -0.09,
  },
  // 4 — The Gift. Pulls back and up, outside the scattering cloud.
  {
    position: new THREE.Vector3(-0.8, 4.2, 15.5),
    target: new THREE.Vector3(-1.4, 0.2, 0),
    fov: 44,
    roll: 0.03,
  },
  // 5 — Epilogue. Far off to the left, leaving the frame clear for content.
  {
    position: new THREE.Vector3(-9.5, 1.6, 13.5),
    target: new THREE.Vector3(-0.4, 0, 0),
    fov: 38,
    roll: 0,
  },
];

export const KEYFRAME_COUNT = keyframes.length;

/**
 * Which layout the artifact holds at each keyframe. Arrival and The Bouquet
 * share the bloom — the difference between them is entirely camera.
 */
export type LayoutName = "bloom" | "taper" | "orb" | "disperse";

export const layoutAtKeyframe: LayoutName[] = [
  "bloom",
  "bloom",
  "taper",
  "orb",
  "disperse",
  "bloom",
];

export const positionCurve = new THREE.CatmullRomCurve3(
  keyframes.map((k) => k.position),
  false,
  "catmullrom",
  0.4,
);
