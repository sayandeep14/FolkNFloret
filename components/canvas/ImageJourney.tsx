"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import { chapters, CHAPTER_SPAN, journeyImages } from "@/lib/journey";
import { scrollState } from "@/lib/scroll-store";
import { fragmentShader, vertexShader } from "./imageJourneyShader";
import { useScrubVideo } from "./useScrubVideo";

const ZERO_SHIFT: [number, number] = [0, 0];

/**
 * Where in a chapter's dwell the wipe to the next one starts and finishes.
 * Outside this band each photograph is held perfectly still to be read.
 */
const WIPE_START = 0.26;
const WIPE_END = 0.74;

/**
 * The backbone of the page: one full-screen quad that cross-dissolves through
 * the chapter photographs with a noise-displaced wipe, warping under scroll
 * velocity and rippling under the cursor.
 */
export function ImageJourney({ film }: { film: "full" | "small" | "off" }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, size } = useThree();

  const textures = useTexture(journeyImages);

  // Only chapter I carries a film today. The chapter data drives which source
  // tier is fetched, and `off` skips the request entirely.
  const filmChapter = chapters.findIndex((c) => c.film);
  const filmSource =
    film === "off" || filmChapter < 0
      ? null
      : film === "small"
        ? chapters[filmChapter].film!.srcSmall
        : chapters[filmChapter].film!.src;
  const scrub = useScrubVideo(filmSource);

  /** The film texture for a chapter, or null to use its still. */
  const filmTextureFor = (index: number) =>
    index === filmChapter && scrub ? scrub.texture : null;

  const filmSizeFor = (index: number) =>
    index === filmChapter && scrub ? chapters[index].film!.size : null;

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

    // A film, once decoded, simply substitutes for that chapter's still in the
    // same texture slot — the wipe, shear and ripple are all indifferent to it.
    const filmA = filmTextureFor(lower);
    const filmB = filmTextureFor(upper);
    const sizeA = filmSizeFor(lower) ?? from.size;
    const sizeB = filmSizeFor(upper) ?? to.size;

    u.uTexA.value = filmA ?? textures[lower];
    u.uTexB.value = filmB ?? textures[upper];
    u.uSizeA.value.set(sizeA[0], sizeA[1]);
    u.uSizeB.value.set(sizeB[0], sizeB[1]);

    // Land the film on its final frame exactly as the wipe finishes. The
    // descent ends low among the rows, which is where the next chapter's
    // photograph picks up — so the cut reads as one continuous move.
    if (scrub && filmChapter >= 0) {
      scrub.seek((t - filmChapter) / WIPE_END);
    }

    // Each chapter runs its own Ken Burns across its own dwell, so the zoom is
    // sampled per-image rather than interpolated between neighbours.
    // A film carries its own camera move, so the Ken Burns is dropped for it —
    // two simultaneous pushes fight each other.
    u.uZoomA.value = filmA
      ? 1
      : THREE.MathUtils.lerp(from.zoom[0], from.zoom[1], progress);
    u.uZoomB.value = filmB
      ? 1
      : THREE.MathUtils.lerp(to.zoom[0], to.zoom[1], progress);
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
    u.uProgress.value = THREE.MathUtils.smoothstep(progress, WIPE_START, WIPE_END);
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
