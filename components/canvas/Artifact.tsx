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
  // Integrated rather than derived from elapsed time, so the rate can vary with
  // scroll speed without the rotation ever jumping.
  const spin = useRef(0);

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

  useFrame(({ clock }, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const time = clock.elapsedTime;
    const still = scrollState.reducedMotion;
    const u = easeKeyframeParam(scrollState.u, MAX_U);

    const lower = Math.floor(u);
    const upper = Math.min(lower + 1, MAX_U);
    const blend = u - lower;

    // Direction-agnostic: scrolling either way opens the form.
    const spread = still ? 0 : Math.min(Math.abs(scrollState.velocity), 1) * 0.85;
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

        // Scrolling hard loosens the form: every petal eases outward along its
        // own radius and tips back, then draws in again as the page settles.
        // The whole mass inhales and exhales with the reader.
        if (spread !== 0) {
          scratch.position.multiplyScalar(1 + spread * (0.1 + (i % 7) * 0.012));
          scratch.wobble.setFromAxisAngle(scratch.wobbleAxis, spread * 0.22);
          scratch.quaternion.multiply(scratch.wobble);
        }
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
      spin.current += delta * (0.045 + Math.abs(scrollState.velocity) * 0.16);
      groupRef.current.rotation.y = spin.current;
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
        0.03 + (sampleNumber("coreIntensity", scrollState.u) / 3.4) * 0.1;
      material.envMapIntensity = sampleNumber("envIntensity", scrollState.u);
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
          Glazed porcelain. Opaque and non-iridescent by decision: transparency
          turned 280 unsorted overlapping instances into mush, and thin-film
          iridescence threw neon across a palette that has none.

          The low roughness and high clearcoat only pay off because there is a
          studio probe to reflect — see Lighting. Sheen supplies the soft
          fall-off at grazing angles that reads as a petal rather than a chip
          of ceramic.
        */}
        <meshPhysicalMaterial
          ref={materialRef}
          side={THREE.DoubleSide}
          roughness={0.28}
          metalness={0}
          clearcoat={0.85}
          clearcoatRoughness={0.22}
          sheen={0.9}
          sheenRoughness={0.55}
          sheenColor="#fff3e6"
          envMapIntensity={1}
        />
      </instancedMesh>

      {/* Lives inside the form, so the flame chapter lights itself. */}
      <pointLight ref={coreRef} position={[0, 0.3, 0]} distance={14} decay={1.4} />
    </group>
  );
}
