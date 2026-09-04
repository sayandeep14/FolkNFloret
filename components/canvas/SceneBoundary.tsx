"use client";

import { Component, type ReactNode } from "react";

/**
 * The WebGL layer is decoration: it supplies the page's background and nothing
 * a reader needs. Without a boundary, anything it throws — a lost context, a
 * driver that refuses a render target, a browser that cannot compile a shader
 * — propagates to the nearest boundary above, which is the root, and takes the
 * whole document with it. The page then goes blank, which is exactly the
 * symptom Safari showed.
 *
 * So it catches, reports once, and renders nothing. The site loses its
 * backdrop and keeps its content.
 */
export class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    // Deliberately console rather than silent: a scene that cannot start is
    // worth knowing about even though it is not worth breaking the page for.
    console.error("[scene] WebGL layer failed, continuing without it:", error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
