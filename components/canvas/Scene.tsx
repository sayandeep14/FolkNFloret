"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import * as THREE from "three";
import { ImageJourney } from "./ImageJourney";
import { PetalDrift } from "./PetalDrift";
import { Effects } from "./Effects";

type Quality = {
  petals: number;
  dpr: [number, number];
  effects: boolean;
};

const HIGH: Quality = { petals: 90, dpr: [1, 2], effects: true };
const MID: Quality = { petals: 55, dpr: [1, 1.5], effects: true };
const LOW: Quality = { petals: 26, dpr: [1, 1.25], effects: false };

/**
 * Tiering is deliberately aggressive. The image journey itself is cheap — one
 * quad — so the budget goes to post FX and petal count, and both are the first
 * things to go on a weak device.
 */
function detectQuality(): Quality {
  if (typeof window === "undefined") return MID;
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  if (coarse || window.innerWidth < 760) return LOW;
  if ((memory !== undefined && memory <= 4) || cores <= 4) return MID;
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
        camera={{ position: [0, 0, 5], fov: 45, near: 0.1, far: 40 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <Suspense fallback={null}>
          <ImageJourney />

          <ambientLight intensity={1.4} />
          <directionalLight position={[2, 3, 4]} intensity={2.2} />
          <PetalDrift count={quality.petals} />

          {quality.effects && <Effects />}
          <AdaptiveDpr pixelated={false} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
