"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleColor } from "@/lib/palette";
import { scrollState } from "@/lib/scroll-store";

const vertexShader = /* glsl */ `
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uBottom;
  varying vec3 vLocal;

  void main() {
    float h = clamp(normalize(vLocal).y * 0.5 + 0.5, 0.0, 1.0);
    // Weight toward the horizon so the gradient isn't a flat linear ramp.
    vec3 color = mix(uBottom, uTop, smoothstep(0.0, 1.0, pow(h, 0.85)));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * The page background is this sphere, not CSS — it lets the palette shift
 * continuously with scroll and picks up the same tone mapping as everything else.
 */
export function Backdrop() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color("#f9f3e9") },
      uBottom: { value: new THREE.Color("#e6d5c2") },
    }),
    [],
  );

  useFrame(() => {
    const material = materialRef.current;
    if (!material) return;
    sampleColor("skyTop", scrollState.u, material.uniforms.uTop.value);
    sampleColor("skyBottom", scrollState.u, material.uniforms.uBottom.value);
  });

  return (
    <mesh frustumCulled={false}>
      <sphereGeometry args={[60, 32, 24]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
        side={THREE.BackSide}
        toneMapped={false}
      />
    </mesh>
  );
}
