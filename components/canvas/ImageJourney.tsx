"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { chapters, CHAPTER_SPAN, journeyImages } from "@/lib/journey";
import { scrollState } from "@/lib/scroll-store";
import { fragmentShader, vertexShader } from "./imageJourneyShader";

const ZERO_SHIFT: [number, number] = [0, 0];

/**
 * The backbone of the page: one full-screen quad that cross-dissolves through
 * the chapter photographs with a noise-displaced wipe, warping under scroll
 * velocity and rippling under the cursor.
 */
export function ImageJourney() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();

  const textures = useTexture(journeyImages);

  useMemo(() => {
    textures.forEach((texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      // The shader samples outside 0..1 during ripple and Ken Burns; clamping
      // avoids a mirrored strip appearing along the edges.
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
    });
  }, [textures]);

  const uniforms = useMemo(
    () => ({
      uTexA: { value: textures[0] },
      uTexB: { value: textures[1] ?? textures[0] },
      uSizeA: { value: new THREE.Vector2(...chapters[0].size) },
      uSizeB: { value: new THREE.Vector2(...chapters[1].size) },
      uPlane: { value: new THREE.Vector2(1, 1) },
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uVelocity: { value: 0 },
      uPointer: { value: new THREE.Vector2(0.5, 0.5) },
      uPointerSpeed: { value: 0 },
      uZoomA: { value: 1 },
      uZoomB: { value: 1 },
      uPanA: { value: new THREE.Vector2() },
      uPanB: { value: new THREE.Vector2() },
      uFade: { value: 0 },
    }),
    [textures],
  );

  useFrame(({ clock }) => {
    const material = materialRef.current;
    if (!material) return;
    const u = material.uniforms;

    const t = THREE.MathUtils.clamp(scrollState.u, 0, CHAPTER_SPAN);
    const lower = Math.floor(t);
    const upper = Math.min(lower + 1, CHAPTER_SPAN);
    const progress = t - lower;

    const from = chapters[lower];
    const to = chapters[upper];

    u.uTexA.value = textures[lower];
    u.uTexB.value = textures[upper];
    u.uSizeA.value.set(from.size[0], from.size[1]);
    u.uSizeB.value.set(to.size[0], to.size[1]);

    // Each chapter runs its own Ken Burns across its own dwell, so the zoom is
    // sampled per-image rather than interpolated between neighbours.
    u.uZoomA.value = THREE.MathUtils.lerp(from.zoom[0], from.zoom[1], progress);
    u.uZoomB.value = THREE.MathUtils.lerp(to.zoom[0], to.zoom[1], progress);
    // On a portrait viewport a 16:9 frame cover-crops to roughly its middle
    // half, which can drop the subject out of shot entirely. Bias the window
    // back toward it, ramped in so landscape phones are barely affected.
    const portrait = THREE.MathUtils.clamp(
      (1.05 - size.width / size.height) / 0.35,
      0,
      1,
    );
    const shiftA = from.mobileShift ?? ZERO_SHIFT;
    const shiftB = to.mobileShift ?? ZERO_SHIFT;

    u.uPanA.value.set(
      from.pan[0] * progress + shiftA[0] * portrait,
      from.pan[1] * progress + shiftA[1] * portrait,
    );
    u.uPanB.value.set(
      to.pan[0] * (progress - 1) + shiftB[0] * portrait,
      to.pan[1] * (progress - 1) + shiftB[1] * portrait,
    );

    // Hold each photograph steady while its chapter is being read, and
    // concentrate the wipe into the middle of the hand-off.
    u.uProgress.value = THREE.MathUtils.smoothstep(progress, 0.26, 0.74);
    u.uTime.value = clock.elapsedTime;
    u.uPlane.value.set(size.width, size.height);
    u.uVelocity.value = scrollState.reducedMotion ? 0 : scrollState.velocity;
    u.uPointer.value.set(scrollState.uvX, scrollState.uvY);
    u.uPointerSpeed.value = scrollState.reducedMotion
      ? 0
      : scrollState.pointerSpeed;
    // Sink to ink as the content sections take over.
    u.uFade.value = THREE.MathUtils.smoothstep(scrollState.epilogue, 0, 0.85);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]} frustumCulled={false}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        toneMapped={false}
      />
    </mesh>
  );
}
