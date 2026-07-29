import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber's model is imperative by design: useFrame callbacks run
    // on the render loop, never during React render, and they mutate long-lived
    // scratch objects specifically to avoid allocating 60 times a second. The
    // same applies to the HTMLVideoElement and THREE.Texture driven by
    // useScrubVideo — seeking a video is a mutation of an external resource,
    // not of React state.
    //
    // The React Compiler immutability rules assume React render semantics and
    // do not apply to either. Note this deliberately does NOT disable the rules
    // that catch real mistakes: reading refs during render and setting state in
    // an effect body were both flagged here and were both genuine bugs, fixed
    // rather than silenced.
    files: ["components/canvas/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
]);
