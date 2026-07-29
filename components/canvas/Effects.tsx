"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import { cameraState } from "@/lib/camera-state";

/**
 * Bloom makes the glazed petals read as ceramic rather than plastic. Depth of
 * field is what makes the whole thing read as photographed rather than
 * rendered — it was dropped from an earlier pass as too expensive, and is back
 * now because it is the largest remaining gain. It runs on the top tier only.
 *
 * The focal plane is driven from the camera rig every frame, so each chapter
 * gets a real focus pull rather than a fixed blur.
 */
export function Effects({ depthOfField }: { depthOfField: boolean }) {
  const dofRef = useRef<DepthOfFieldEffect>(null);

  useFrame(() => {
    const dof = dofRef.current;
    if (!dof) return;
    // `target` makes the effect recompute focusDistance from the camera each
    // frame, which is far steadier than setting a normalised distance by hand.
    dof.target = cameraState.focusPoint;
    dof.bokehScale = cameraState.bokehScale;
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {depthOfField ? (
        <DepthOfField
          ref={dofRef}
          focusDistance={0.02}
          focalLength={0.035}
          bokehScale={2}
          height={480}
        />
      ) : (
        <></>
      )}
      <Bloom
        intensity={0.42}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.3}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <Vignette offset={0.28} darkness={0.62} eskil={false} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
    </EffectComposer>
  );
}
