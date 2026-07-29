"use client";

import dynamic from "next/dynamic";

/**
 * Client boundary for the WebGL layer. `ssr: false` is only permitted inside a
 * client component, and it is what lets Scene read window during its first
 * render instead of flipping state in an effect.
 */
export const SceneMount = dynamic(
  () => import("./Scene").then((m) => m.Scene),
  { ssr: false },
);
