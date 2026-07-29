"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { sampleColor, sampleNumber } from "@/lib/palette";
import { scrollState } from "@/lib/scroll-store";

/**
 * A photographic studio rather than a set of bare lights.
 *
 * The Lightformers below are the softboxes: a long overhead strip, two side
 * panels and a ring. They exist to be *reflected* — that is what separates a
 * porcelain surface from a flat matte one, and it is the single largest
 * contributor to how expensive the form looks. The directional lights only
 * shape the diffuse falloff on top of that.
 *
 * The probe is baked once (`frames={1}`); the per-chapter mood comes from
 * animating the material's envMapIntensity, not from re-rendering it.
 */
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
      rimRef.current.intensity = sampleNumber("keyIntensity", u) * 0.55;
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

      <Environment frames={1} resolution={256} background={false}>
        {/* Overhead strip — the long highlight that runs down each petal. */}
        <Lightformer
          form="rect"
          intensity={3.2}
          color="#fff6ea"
          position={[0, 6, 1]}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={[10, 4, 1]}
        />
        {/* Key-side panel, large and soft. */}
        <Lightformer
          form="rect"
          intensity={2.2}
          color="#fffaf4"
          position={[-6, 2, 4]}
          rotation={[0, Math.PI / 2.4, 0]}
          scale={[8, 6, 1]}
        />
        {/* Opposite panel, dimmer — keeps the shadow side from going dead. */}
        <Lightformer
          form="rect"
          intensity={0.9}
          color="#e8eef0"
          position={[7, 1, -3]}
          rotation={[0, -Math.PI / 2.4, 0]}
          scale={[7, 5, 1]}
        />
        {/* A ring behind the form: the small circular catchlights on the tips. */}
        <Lightformer
          form="ring"
          intensity={2.6}
          color="#ffd9a8"
          position={[1.5, 1.5, -6]}
          scale={4}
        />
        {/* Floor bounce, so the undersides are not black. */}
        <Lightformer
          form="rect"
          intensity={0.7}
          color="#d8cdbe"
          position={[0, -5, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[10, 10, 1]}
        />
      </Environment>
    </>
  );
}
