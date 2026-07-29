"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cameraState } from "@/lib/camera-state";
import { KEYFRAME_COUNT, keyframes, positionCurve } from "@/lib/keyframes";
import { damp, easeKeyframeParam } from "@/lib/math";
import { scrollState } from "@/lib/scroll-store";

const MAX_U = KEYFRAME_COUNT - 1;

/** How hard the camera leans into a lateral move, and the ceiling on it. */
const BANK_GAIN = 0.016;
const BANK_LIMIT = 0.11;

export function CameraRig() {
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      previous: new THREE.Vector3(),
      move: new THREE.Vector3(),
      right: new THREE.Vector3(),
      forward: new THREE.Vector3(),
      up: new THREE.Vector3(0, 1, 0),
      orbit: new THREE.Vector3(),
      bank: 0,
      seeded: false,
    }),
    [],
  );

  useFrame(({ camera, size }, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const time = performance.now() / 1000;
    const still = scrollState.reducedMotion;
    const u = easeKeyframeParam(scrollState.u, MAX_U);

    const lower = Math.floor(u);
    const upper = Math.min(lower + 1, MAX_U);
    const blend = u - lower;
    const a = keyframes[lower];
    const b = keyframes[upper];

    // Position rides the Catmull-Rom curve so the flight arcs between stations.
    positionCurve.getPointAt(
      THREE.MathUtils.clamp(u / MAX_U, 0, 1),
      scratch.position,
    );
    scratch.target.lerpVectors(a.target, b.target, blend);

    // A portrait viewport crops the horizontal field, which brings the form
    // forward until it crowds the copy. Dolly back along the view axis so the
    // composition holds at any aspect.
    const portrait = THREE.MathUtils.clamp(
      (1.05 - size.width / size.height) / 0.4,
      0,
      1,
    );
    if (portrait > 0) {
      scratch.forward.subVectors(scratch.position, scratch.target);
      scratch.position
        .copy(scratch.target)
        .addScaledVector(scratch.forward, 1 + portrait * 0.42);
    }

    const fov = THREE.MathUtils.lerp(a.fov, b.fov, blend);
    const roll = THREE.MathUtils.lerp(a.roll, b.roll, blend);
    const focus = THREE.MathUtils.lerp(a.focus, b.focus, blend);
    const bokeh = THREE.MathUtils.lerp(a.bokeh, b.bokeh, blend);
    const orbit = THREE.MathUtils.lerp(a.orbit, b.orbit, blend);

    if (!still) {
      // Orbital drift: a slow ellipse in the plane facing the subject, so the
      // camera keeps moving even while a chapter is being held and read. Its
      // radius is authored per station — tight for the macro, wide for the
      // establishing shots.
      scratch.forward.subVectors(scratch.target, scratch.position).normalize();
      scratch.right.crossVectors(scratch.forward, scratch.up).normalize();

      scratch.orbit
        .copy(scratch.right)
        .multiplyScalar(Math.sin(time * 0.19) * orbit)
        .addScaledVector(scratch.up, Math.cos(time * 0.13) * orbit * 0.55);
      scratch.position.add(scratch.orbit);

      // A second, faster tremor on a different axis keeps the ellipse from
      // reading as a loop.
      scratch.position.z += Math.sin(time * 0.41) * orbit * 0.12;

      // Pointer parallax.
      scratch.position.addScaledVector(scratch.right, scrollState.pointerX * 0.5);
      scratch.position.y -= scrollState.pointerY * 0.3;
      scratch.target.x += scrollState.pointerX * 0.1;
    }

    const rate = damp(delta, still ? 40 : 3.2);

    if (!scratch.seeded) {
      camera.position.copy(scratch.position);
      scratch.previous.copy(scratch.position);
      scratch.seeded = true;
    }

    camera.position.lerp(scratch.position, rate);

    // Bank into the turn. Derived from how fast the camera is actually moving
    // sideways rather than from the curve, so it responds to scrub speed and
    // settles to level whenever the camera comes to rest.
    scratch.move.subVectors(camera.position, scratch.previous);
    scratch.previous.copy(camera.position);

    camera.lookAt(scratch.target);

    if (!still) {
      camera.getWorldDirection(scratch.forward);
      scratch.right.crossVectors(scratch.forward, scratch.up).normalize();
      const lateral = delta > 0 ? scratch.move.dot(scratch.right) / delta : 0;
      const targetBank = THREE.MathUtils.clamp(
        -lateral * BANK_GAIN,
        -BANK_LIMIT,
        BANK_LIMIT,
      );
      scratch.bank += (targetBank - scratch.bank) * damp(delta, 2.4);
    } else {
      scratch.bank = 0;
    }

    const totalRoll = roll + scratch.bank;
    if (totalRoll !== 0) camera.rotateZ(totalRoll);

    // Very slight breathing on the lens keeps long holds from feeling frozen.
    const targetFov = still ? fov : fov + Math.sin(time * 0.23) * 0.5;
    if (Math.abs(camera.fov - targetFov) > 0.001) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, rate);
      camera.updateProjectionMatrix();
    }

    // Publish the focal plane for the depth of field. Focusing short of the
    // target is what turns the close stations into macro shots.
    camera.getWorldDirection(scratch.forward);
    const distance = camera.position.distanceTo(scratch.target);
    cameraState.focusPoint
      .copy(camera.position)
      .addScaledVector(scratch.forward, distance * focus);
    cameraState.bokehScale = bokeh;
  });

  return null;
}
