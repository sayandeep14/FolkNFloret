"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";
import { keyframes } from "@/lib/keyframes";
import { Artifact } from "./Artifact";
import { Backdrop } from "./Backdrop";
import { CameraRig } from "./CameraRig";
import { Effects } from "./Effects";
import { Lighting } from "./Lighting";
import { Particles } from "./Particles";

type Quality = {
  petals: number;
  motes: number;
  dpr: [number, number];
  effects: boolean;
  /** Depth of field is the most expensive pass here, so it is top tier only. */
  depthOfField: boolean;
};

const HIGH: Quality = {
  petals: 280,
  motes: 900,
  dpr: [1, 1.6],
  effects: true,
  depthOfField: true,
};
const MID: Quality = {
  petals: 200,
  motes: 600,
  dpr: [1, 1.5],
  effects: true,
  depthOfField: false,
};
const LOW: Quality = {
  petals: 130,
  motes: 320,
  dpr: [1, 1.25],
  effects: false,
  depthOfField: false,
};

function detectQuality(): Quality {
  if (typeof window === "undefined") return HIGH;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    userAgentData?: unknown;
  };
  const cores = nav.hardwareConcurrency ?? 4;

  if (coarse || window.innerWidth < 900) return LOW;
  if ((nav.deviceMemory !== undefined && nav.deviceMemory <= 4) || cores <= 4) {
    return MID;
  }

  // deviceMemory is Chromium-only. Everywhere else it is undefined, and the
  // old check read that as "plenty" and handed Safari the top tier including
  // depth of field — the most expensive pass here — on a browser whose WebGL
  // headroom we cannot measure. Unmeasurable is not the same as ample.
  if (nav.userAgentData === undefined) return MID;

  return HIGH;
}

export function Scene() {
  // Safe in the initial render because SceneMount imports this with ssr: false,
  // so there is always a window by the time this runs.
  const [quality] = useState<Quality>(detectQuality);

  return (
    <div className="scene" aria-hidden="true">
      <Canvas
        dpr={quality.dpr}
        camera={{
          position: keyframes[0].position.toArray(),
          fov: keyframes[0].fov,
          near: 0.1,
          far: 120,
        }}
        gl={{
          antialias: !quality.effects,
          alpha: false,
          powerPreference: "high-performance",
          // Tone mapping belongs inside the effect chain, so bloom and depth
          // of field see genuine HDR values. The bottom tier has no chain, so
          // it keeps ACES on the renderer instead — without either, the
          // brightest speculars have nothing mapping them down and roll over.
          toneMapping: quality.effects
            ? THREE.NoToneMapping
            : THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <Suspense fallback={null}>
          <Backdrop />
          <Lighting />
          <Artifact count={quality.petals} />
          <Particles count={quality.motes} />
          <CameraRig />
          {quality.effects && (
            <Effects depthOfField={quality.depthOfField} />
          )}
          <AdaptiveDpr pixelated={false} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
