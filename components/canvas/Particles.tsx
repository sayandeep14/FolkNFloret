"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32, TAU } from "@/lib/math";
import { sampleColor } from "@/lib/palette";
import { scrollState } from "@/lib/scroll-store";

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uStill;
  attribute float aSize;
  attribute float aPhase;
  attribute float aDrift;
  varying float vAlpha;

  void main() {
    vec3 p = position;

    // Slow upward drift that wraps, plus a lazy horizontal sway.
    float rise = mod(p.y + uTime * aDrift * (1.0 - uStill) * 0.35 + 9.0, 18.0) - 9.0;
    p.y = rise;
    p.x += sin(uTime * 0.2 * (1.0 - uStill) + aPhase) * 0.5;
    p.z += cos(uTime * 0.16 * (1.0 - uStill) + aPhase) * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (14.0 / -mv.z);

    // Fade at the top and bottom of the wrap so nothing pops in or out.
    vAlpha = smoothstep(9.0, 6.0, abs(rise)) * (0.35 + 0.65 * sin(aPhase + uTime * 0.4));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // Soft round sprite, no texture needed.
    float d = length(gl_PointCoord - 0.5);
    float mask = smoothstep(0.5, 0.05, d);
    if (mask < 0.01) discard;
    gl_FragColor = vec4(uColor, mask * clamp(vAlpha, 0.0, 1.0) * 0.55);
  }
`;

/** Pollen and dust suspended in the air around the artifact. */
export function Particles({ count }: { count: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const rng = mulberry32(0xd057);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    const drifts = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      // Cylindrical shell around the artifact, denser near the middle.
      const angle = rng() * TAU;
      const radius = 1.5 + Math.pow(rng(), 0.6) * 9;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (rng() - 0.5) * 18;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      sizes[i] = 0.6 + rng() * 2.4;
      phases[i] = rng() * TAU;
      drifts[i] = 0.4 + rng() * 1.4;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    g.setAttribute("aDrift", new THREE.BufferAttribute(drifts, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 24);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uStill: { value: 0 },
      uColor: { value: new THREE.Color("#ffe9c9") },
    }),
    [],
  );

  useFrame(({ clock, gl }) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uPixelRatio.value = gl.getPixelRatio();
    material.uniforms.uStill.value = scrollState.reducedMotion ? 1 : 0;
    sampleColor("core", scrollState.u, material.uniforms.uColor.value);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
