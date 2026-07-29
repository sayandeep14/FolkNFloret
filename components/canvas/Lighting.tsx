"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleColor, sampleNumber } from "@/lib/palette";
import { scrollState } from "@/lib/scroll-store";

export function Lighting() {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.DirectionalLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const u = scrollState.u;

    if (keyRef.current) {
      keyRef.current.color.copy(sampleColor("key", u, color));
      keyRef.current.intensity = sampleNumber("keyIntensity", u);
    }
    if (rimRef.current) {
      // Rim picks up the sky so the silhouette always separates from the backdrop.
      rimRef.current.color.copy(sampleColor("skyTop", u, color));
      rimRef.current.intensity = sampleNumber("keyIntensity", u) * 0.7;
    }
    if (ambientRef.current) {
      ambientRef.current.color.copy(sampleColor("fill", u, color));
      ambientRef.current.intensity = sampleNumber("fillIntensity", u);
    }
  });

  return (
    <>
      <ambientLight ref={ambientRef} />
      <directionalLight ref={keyRef} position={[-5, 7, 6]} />
      <directionalLight ref={rimRef} position={[4, 2, -7]} />
    </>
  );
}
