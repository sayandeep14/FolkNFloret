"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { buildLayouts, createPetalGeometry } from "@/lib/artifact-geometry";
import { KEYFRAME_COUNT, layoutAtKeyframe } from "@/lib/keyframes";
import { easeKeyframeParam } from "@/lib/math";
import { sampleColor, sampleNumber } from "@/lib/palette";
import { scrollState } from "@/lib/scroll-store";

const MAX_U = KEYFRAME_COUNT - 1;

export function Artifact({ count }: { count: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const coreRef = useRef<THREE.PointLight>(null);

  const geometry = useMemo(() => createPetalGeometry(), []);
  const layouts = useMemo(() => buildLayouts(count), [count]);

  // Scratch objects, reused every frame so the loop stays allocation-free.
  const scratch = useMemo(
    () => ({
      position: new THREE.Vector3(),
      quaternion: new THREE.Quaternion(),
      wobble: new THREE.Quaternion(),
      wobbleAxis: new THREE.Vector3(1, 0, 0.4).normalize(),
      scale: new THREE.Vector3(),
      matrix: new THREE.Matrix4(),
      petalColor: new THREE.Color(),
      coreColor: new THREE.Color(),
    }),
    [],
  );

  useLayoutEffect(() => {
    return () => geometry.dispose();
  }, [geometry]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.elapsedTime;
    const still = scrollState.reducedMotion;
    const u = easeKeyframeParam(scrollState.u, MAX_U);

    const lower = Math.floor(u);
    const upper = Math.min(lower + 1, MAX_U);
    const blend = u - lower;
    const from = layouts[layoutAtKeyframe[lower]];
    const to = layouts[layoutAtKeyframe[upper]];

    for (let i = 0; i < count; i += 1) {
      scratch.position.lerpVectors(from.positions[i], to.positions[i], blend);
      scratch.quaternion.slerpQuaternions(
        from.quaternions[i],
        to.quaternions[i],
        blend,
      );
      const size = THREE.MathUtils.lerp(from.scales[i], to.scales[i], blend);

      if (!still) {
        // Each petal breathes on its own phase so the mass never pulses as one.
        const phase = time * 0.36 + i * 0.37;
        scratch.position.y += Math.sin(phase) * 0.045;
        scratch.position.x += Math.cos(phase * 0.8) * 0.03;
        scratch.wobble.setFromAxisAngle(
          scratch.wobbleAxis,
          Math.sin(phase * 0.6) * 0.07,
        );
        scratch.quaternion.multiply(scratch.wobble);
      }

      scratch.matrix.compose(
        scratch.position,
        scratch.quaternion,
        scratch.scale.setScalar(size),
      );
      mesh.setMatrixAt(i, scratch.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;

    if (groupRef.current && !still) {
      groupRef.current.rotation.y = time * 0.045;
    }

    const material = materialRef.current;
    if (material) {
      sampleColor("petal", scrollState.u, scratch.petalColor);
      material.color.copy(scratch.petalColor);
      sampleColor("core", scrollState.u, scratch.coreColor);
      material.emissive.copy(scratch.coreColor);
      // Petals only self-illuminate meaningfully during The Flame, and never
      // hard enough to push the bloom buffer into blown-out artefacts.
      material.emissiveIntensity =
        0.03 + (sampleNumber("coreIntensity", scrollState.u) / 7.5) * 0.14;
    }

    const core = coreRef.current;
    if (core) {
      sampleColor("core", scrollState.u, scratch.coreColor);
      core.color.copy(scratch.coreColor);
      const flicker = still ? 1 : 1 + Math.sin(time * 7.3) * 0.05;
      core.intensity = sampleNumber("coreIntensity", scrollState.u) * flicker;
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[geometry, undefined, count]}
        frustumCulled={false}
        castShadow={false}
        receiveShadow={false}
      >
        {/*
          Opaque, and no iridescence. Both were tried: transparency turned 280
          unsorted overlapping instances into mush, and thin-film iridescence
          threw neon green and blue across a palette that has neither.
          Sheen alone gives the soft petal falloff this needs.
        */}
        <meshPhysicalMaterial
          ref={materialRef}
          side={THREE.DoubleSide}
          roughness={0.44}
          metalness={0}
          clearcoat={0.35}
          clearcoatRoughness={0.5}
          sheen={1}
          sheenRoughness={0.62}
          sheenColor="#fff1e4"
        />
      </instancedMesh>

      {/* Lives inside the form, so the flame chapter lights itself. */}
      <pointLight ref={coreRef} position={[0, 0.3, 0]} distance={14} decay={1.4} />
    </group>
  );
}
