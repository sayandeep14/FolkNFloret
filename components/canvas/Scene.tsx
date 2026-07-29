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
};

const HIGH: Quality = { petals: 280, motes: 900, dpr: [1, 1.6], effects: true };
const LOW: Quality = { petals: 130, motes: 320, dpr: [1, 1.25], effects: false };

function detectQuality(): Quality {
  if (typeof window === "undefined") return HIGH;
  const narrow = window.innerWidth < 900;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const thin =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory !==
      undefined &&
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory! <= 4;
  return narrow || coarse || thin ? LOW : HIGH;
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
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
      >
        <Suspense fallback={null}>
          <Backdrop />
          <Lighting />
          <Artifact count={quality.petals} />
          <Particles count={quality.motes} />
          <CameraRig />
          {quality.effects && <Effects />}
          <AdaptiveDpr pixelated={false} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
