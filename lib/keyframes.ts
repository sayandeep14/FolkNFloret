import * as THREE from "three";

export type Keyframe = {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  /** Radians of dutch roll applied after lookAt, on top of automatic banking. */
  roll: number;
  /**
   * Where the lens focuses, as a multiple of the distance to the target. 1 sits
   * the focal plane on the target; below 1 pulls focus in front of it, throwing
   * the far side of the form out — which is what makes a close hold read as a
   * macro rather than as a small object.
   */
  focus: number;
  /** Aperture. Larger blurs harder. */
  bokeh: number;
  /** How far the camera keeps drifting while holding here, in world units. */
  orbit: number;
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
  // 0 — Arrival. Well above the rim, so the phyllotaxis spiral reads as a
  // spiral. At a shallower elevation the dome flattens into a shell.
  {
    position: new THREE.Vector3(1.6, 7.0, 10.6),
    target: new THREE.Vector3(-0.7, 0.2, 0),
    fov: 34,
    roll: 0,
    focus: 1.0,
    bokeh: 0.9,
    orbit: 0.5,
  },
  // 1 — The Preserved. Swings right and drops in close over the lens. Held far
  // higher than a bloom would need: at a shallow elevation a flat stratum goes
  // edge-on and reads as nothing at all. The move from station 0 is proximity
  // — same elevation, a third of the distance.
  {
    position: new THREE.Vector3(6.2, 5.0, 6.2),
    target: new THREE.Vector3(-1.5, 0.3, 0),
    fov: 40,
    roll: -0.05,
    focus: 0.86,
    bokeh: 2.4,
    orbit: 0.75,
  },
  // 2 — The Flame. Crosses to the left and climbs as the column forms.
  {
    position: new THREE.Vector3(-4.8, 2.6, 8.2),
    target: new THREE.Vector3(-1.3, 0.6, 0),
    fov: 36,
    roll: 0.07,
    focus: 0.94,
    bokeh: 1.7,
    orbit: 0.6,
  },
  // 3 — The Table. Closest hold of the journey, tight on the orb.
  {
    position: new THREE.Vector3(2.1, 0.5, 4.4),
    target: new THREE.Vector3(-0.9, 0.05, 0),
    fov: 32,
    roll: -0.09,
    focus: 0.78,
    bokeh: 3.4,
    orbit: 0.35,
  },
  // 4 — The Gift. Pulls back and up, outside the scattering cloud.
  {
    position: new THREE.Vector3(-0.8, 4.2, 15.5),
    target: new THREE.Vector3(-1.4, 0.2, 0),
    fov: 44,
    roll: 0.03,
    focus: 1.05,
    bokeh: 1.2,
    orbit: 0.9,
  },
  // 5 — Epilogue. Far off to the left, leaving the frame clear for content.
  {
    position: new THREE.Vector3(-9.5, 1.6, 13.5),
    target: new THREE.Vector3(-0.4, 0, 0),
    fov: 38,
    roll: 0,
    focus: 1.0,
    bokeh: 1.0,
    orbit: 0.7,
  },
];

export const KEYFRAME_COUNT = keyframes.length;

/**
 * Which layout the artifact holds at each keyframe. Arrival opens on the living
 * bloom and the second station settles it into the suspended lens, so the first
 * movement of the page is growth being stopped and kept — which is the whole
 * proposition of the house.
 */
export type LayoutName = "bloom" | "suspend" | "taper" | "orb" | "disperse";

export const layoutAtKeyframe: LayoutName[] = [
  "bloom",
  "suspend",
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
