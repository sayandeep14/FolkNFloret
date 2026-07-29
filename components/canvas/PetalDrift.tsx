"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createPetalGeometry } from "@/lib/petal";
import { mulberry32, TAU } from "@/lib/math";
import { scrollState } from "@/lib/scroll-store";

type Mote = {
  x: number;
  y: number;
  z: number;
  scale: number;
  spin: number;
  spinRate: number;
  fall: number;
  sway: number;
  phase: number;
};

/**
 * Petals drifting between the camera and the photographs. This is the thread
 * that ties the abstract v1 language to the photoreal world — the same petal
 * geometry, now foreground atmosphere rather than the subject.
 */
export function PetalDrift({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const { viewport } = useThree();
  const geometry = useMemo(() => createPetalGeometry(), []);

  const motes = useMemo<Mote[]>(() => {
    const rng = mulberry32(0xfa11);
    return Array.from({ length: count }, () => ({
      x: (rng() - 0.5) * 2,
      y: rng(),
      z: rng(),
      scale: 0.028 + rng() * 0.075,
      spin: rng() * TAU,
      spinRate: (rng() - 0.5) * 0.9,
      fall: 0.02 + rng() * 0.05,
      sway: 0.3 + rng() * 0.9,
      phase: rng() * TAU,
    }));
  }, [count]);

  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      euler: new THREE.Euler(),
      scale: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
    }),
    [],
  );

  useLayoutEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = scrollState.reducedMotion ? 0 : clock.elapsedTime;
    const halfW = viewport.width * 0.62;
    const halfH = viewport.height * 0.62;

    for (let i = 0; i < count; i += 1) {
      const m = motes[i];

      // Fall and wrap. Scroll velocity adds a rush in the travel direction.
      const drift = time * m.fall + scrollState.velocity * 0.06 * m.sway;
      const y = ((((m.y - drift) % 1) + 1) % 1) * 2 - 1;

      // Nearer petals parallax further with the pointer.
      const depth = 0.4 + m.z * 2.6;
      const parallax = (1 - m.z) * 0.5;

      scratch.position.set(
        m.x * halfW +
          Math.sin(time * 0.4 + m.phase) * m.sway * 0.35 +
          scrollState.pointerX * parallax,
        y * halfH - scrollState.pointerY * parallax * 0.5,
        depth,
      );

      scratch.euler.set(
        time * m.spinRate * 0.6 + m.phase,
        time * m.spinRate + m.spin,
        Math.sin(time * 0.5 + m.phase) * 0.4,
      );
      scratch.quaternion.setFromEuler(scratch.euler);

      scratch.matrix.compose(
        scratch.position,
        scratch.quaternion,
        scratch.scale.setScalar(m.scale),
      );
      mesh.setMatrixAt(i, scratch.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    const material = mesh.material as THREE.MeshStandardMaterial;
    // Petals thin out as the journey hands over to the content sections.
    material.opacity = 0.4 * (1 - scrollState.epilogue);
    mesh.visible = material.opacity > 0.01;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, undefined, count]}
      frustumCulled={false}
    >
      <meshStandardMaterial
        side={THREE.DoubleSide}
        color="#f7e2dc"
        roughness={0.6}
        metalness={0}
        transparent
        opacity={0.4}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
