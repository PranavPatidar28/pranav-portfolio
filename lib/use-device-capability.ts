"use client";

import { useEffect, useState } from "react";

export type Tier = "high" | "mid";

export type Capability = {
  /** decision resolved on the client after mount */
  ready: boolean;
  /** render the full WebGL scene */
  use3D: boolean;
  /** GPU tier — gates the heavy postprocessing stack */
  tier: Tier;
  /** user asked for reduced motion */
  reducedMotion: boolean;
  /** coarse pointer (touch) device */
  touch: boolean;
};

/**
 * Decides whether this device should get the full 3D experience or the
 * lightweight 2D fallback, and at what fidelity. Conservative on purpose:
 * a janky 3D scene reads as "ships bugs", so we only opt in when we're
 * fairly confident.
 */
export function useDeviceCapability(): Capability {
  const [cap, setCap] = useState<Capability>({
    ready: false,
    use3D: false,
    tier: "mid",
    reducedMotion: false,
    touch: false,
  });

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const touch = window.matchMedia("(pointer: coarse)").matches;

    const { use3D, tier } = assess({ reducedMotion });

    setCap({ ready: true, use3D, tier, reducedMotion, touch });
  }, []);

  return cap;
}

function assess({ reducedMotion }: { reducedMotion: boolean }): {
  use3D: boolean;
  tier: Tier;
} {
  if (reducedMotion) return { use3D: false, tier: "mid" };

  // Explicit overrides for testing/perf.
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    if (params.has("lite")) return { use3D: false, tier: "mid" };
    if (params.has("full")) return { use3D: true, tier: "high" };
  }

  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (typeof mem === "number" && mem > 0 && mem < 4)
    return { use3D: false, tier: "mid" };

  const cores = navigator.hardwareConcurrency;
  if (typeof cores === "number" && cores > 0 && cores < 4)
    return { use3D: false, tier: "mid" };

  const gl = getGL();
  if (!gl) return { use3D: false, tier: "mid" };

  // Software renderer → too slow for WebGL at all.
  const renderer = getRenderer(gl);
  if (renderer && /swiftshader|software|llvmpipe/i.test(renderer))
    return { use3D: false, tier: "mid" };

  // Tier the fidelity: integrated GPUs and modest core counts get the
  // lighter post stack; strong machines get the full cinematic treatment.
  const isIntegrated = renderer
    ? /intel|apple gpu|mali|adreno|powervr/i.test(renderer)
    : true;
  const strong =
    typeof cores === "number" && cores >= 8 && !isIntegrated;
  const ampleMem = typeof mem === "number" ? mem >= 8 : false;

  const tier: Tier = strong || ampleMem ? "high" : "mid";
  return { use3D: true, tier };
}

function getGL(): WebGLRenderingContext | null {
  try {
    const canvas = document.createElement("canvas");
    return (canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  } catch {
    return null;
  }
}

function getRenderer(gl: WebGLRenderingContext): string | null {
  try {
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (!dbg) return null;
    return gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) as string;
  } catch {
    return null;
  }
}
