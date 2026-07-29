import * as THREE from "three";

/**
 * What the lens is doing, published by CameraRig and read by Effects.
 *
 * Kept out of scrollState because nothing outside the canvas has any business
 * with it, and out of React because both ends run inside useFrame.
 */
export const cameraState = {
  /** World-space point the lens is focused on. */
  focusPoint: new THREE.Vector3(),
  /** Aperture, as postprocessing's bokehScale. */
  bokehScale: 1,
};
