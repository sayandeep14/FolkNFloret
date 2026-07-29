"use client";

import { useEffect, useState } from "react";
import * as THREE from "three";

export type ScrubVideo = {
  texture: THREE.VideoTexture;
  /** Seek to a normalised position, 0 -> 1. */
  seek: (t01: number) => void;
};

/** Half a frame at 24fps — below this a reseek would decode the same frame. */
const SEEK_EPSILON = 1 / 48;

type Rig = { video: HTMLVideoElement; texture: THREE.VideoTexture };

/**
 * A paused <video> driven entirely by scroll position, exposed as a texture.
 *
 * The source must be encoded all-intra (`-g 1`). With a normal keyframe
 * interval every seek decodes forward from the previous keyframe, which is
 * what makes most scroll-scrubbed video stutter.
 *
 * Returns null until a frame has actually decoded, so the caller renders its
 * still until then and keeps it forever if the video never arrives. Nothing
 * here is allowed to break the page.
 */
export function useScrubVideo(src: string | null): ScrubVideo | null {
  // Held in state, not a ref: the returned texture is part of this hook's
  // render output, and output must never depend on a mutable ref. It is
  // published from the `seeked` handler — an event, not the effect body — so
  // there is always a decoded frame behind it.
  const [rig, setRig] = useState<Rig | null>(null);

  useEffect(() => {
    if (!src) return;

    const video = document.createElement("video");
    video.src = src;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = false;
    video.autoplay = false;
    video.preload = "auto";
    video.playsInline = true;
    // Safari respects the attribute form, not just the property.
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("aria-hidden", "true");
    video.setAttribute("tabindex", "-1");

    // Must live in the document: Safari refuses to decode a detached video,
    // and `display: none` stops decoding everywhere. A 1px transparent element
    // parked off-screen keeps it alive without being visible or focusable.
    Object.assign(video.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "1px",
      height: "1px",
      opacity: "0",
      pointerEvents: "none",
      zIndex: "-1",
    });
    document.body.appendChild(video);

    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    const onSeeked = () => {
      texture.needsUpdate = true;
      setRig({ video, texture });
    };

    const onLoaded = () => {
      // iOS will not decode frames for a video that has never played, even
      // when we only ever intend to seek it. Priming with a muted play/pause
      // is the standard way round it; if it is refused we stay on the still.
      const played = video.play();
      if (played?.then) {
        played
          .then(() => {
            video.pause();
            video.currentTime = 0;
          })
          .catch(() => {
            /* autoplay refused — the still fallback stands */
          });
      }
      // Force one decode so there is a frame to sample before we publish.
      video.currentTime = 0.001;
    };

    video.addEventListener("loadeddata", onLoaded);
    video.addEventListener("seeked", onSeeked);
    if (video.readyState >= 2) onLoaded();

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      video.removeEventListener("seeked", onSeeked);
      video.pause();
      video.removeAttribute("src");
      video.load();
      video.remove();
      texture.dispose();
      setRig(null);
    };
  }, [src]);

  if (!rig) return null;

  return {
    texture: rig.texture,
    seek: (t01: number) => {
      const { video, texture } = rig;
      const duration = video.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      // Stop just short of the end: seeking exactly to duration can park some
      // browsers on a blank frame.
      const target = Math.min(Math.max(t01, 0), 1) * (duration - SEEK_EPSILON);
      if (Math.abs(video.currentTime - target) < SEEK_EPSILON) return;
      video.currentTime = target;
      texture.needsUpdate = true;
    },
  };
}
