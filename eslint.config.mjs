import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber's model is imperative by design: useFrame callbacks run
    // on the render loop, never during React render, and they mutate long-lived
    // scratch objects specifically to avoid allocating 60 times a second.
    // The React Compiler immutability rules assume React render semantics and
    // do not apply inside that loop.
    files: ["components/canvas/**/*.tsx"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "next-env.d.ts"]),
]);
