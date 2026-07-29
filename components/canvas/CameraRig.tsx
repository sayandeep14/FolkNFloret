"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { KEYFRAME_COUNT, keyframes, positionCurve } from "@/lib/keyframes";
import { damp, easeKeyframeParam } from "@/lib/math";
import { scrollState } from "@/lib/scroll-store";

const MAX_U = KEYFRAME_COUNT - 1;

export function CameraRig() {
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      target: new THREE.Vector3(),
      pointer: new THREE.Vector2(),
    }),
    [],
  );

  useFrame(({ camera, clock }, delta) => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;

    const time = clock.elapsedTime;
    const still = scrollState.reducedMotion;
    const u = easeKeyframeParam(scrollState.u, MAX_U);

    const lower = Math.floor(u);
    const upper = Math.min(lower + 1, MAX_U);
    const blend = u - lower;

    // Position rides the Catmull-Rom curve so the flight arcs between stations.
    positionCurve.getPointAt(
      THREE.MathUtils.clamp(u / MAX_U, 0, 1),
      scratch.position,
    );
    scratch.target.lerpVectors(
      keyframes[lower].target,
      keyframes[upper].target,
      blend,
    );

    const fov = THREE.MathUtils.lerp(
      keyframes[lower].fov,
      keyframes[upper].fov,
      blend,
    );
    const roll = THREE.MathUtils.lerp(
      keyframes[lower].roll,
      keyframes[upper].roll,
      blend,
    );

    if (!still) {
      // Two incommensurate frequencies per axis: reads as a hand-held float
      // rather than a loop.
      scratch.position.x += Math.sin(time * 0.21) * 0.16 + Math.sin(time * 0.53) * 0.06;
      scratch.position.y += Math.cos(time * 0.17) * 0.13 + Math.sin(time * 0.44) * 0.05;
      scratch.position.z += Math.sin(time * 0.13) * 0.1;

      // Pointer parallax, eased toward the live value.
      scratch.pointer.set(scrollState.pointerX, scrollState.pointerY);
      scratch.position.x += scratch.pointer.x * 0.55;
      scratch.position.y += -scratch.pointer.y * 0.35;
      scratch.target.x += scratch.pointer.x * 0.12;
    }

    const rate = damp(delta, still ? 40 : 3.2);
    camera.position.lerp(scratch.position, rate);
    camera.lookAt(scratch.target);
    if (roll !== 0) camera.rotateZ(roll);

    // Very slight breathing on the lens keeps long holds from feeling frozen.
    const targetFov = still ? fov : fov + Math.sin(time * 0.23) * 0.5;
    if (Math.abs(camera.fov - targetFov) > 0.001) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, rate);
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
