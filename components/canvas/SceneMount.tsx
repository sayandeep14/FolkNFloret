"use client";

import dynamic from "next/dynamic";
import { SceneBoundary } from "./SceneBoundary";

/**
 * Client boundary for the WebGL layer. `ssr: false` is only permitted inside a
 * client component, and it is what lets Scene read window during its first
 * render instead of flipping state in an effect.
 *
 * Wrapped so a failure inside the canvas costs the backdrop and not the page.
 */
const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
});

export function SceneMount() {
  return (
    <SceneBoundary>
      <Scene />
    </SceneBoundary>
  );
}
