"use client";

import { useEffect, useRef } from "react";
import {
  createFluidSimulation,
  type FluidHandle,
  type FluidConfig,
} from "@/lib/fluid/fluidSim";
import type { Tier } from "@/lib/use-device-capability";

/**
 * Full-viewport WebGL fluid backdrop. Shows a black & white portrait by
 * default; where the pointer moves, the fluid mask reveals the colour version
 * of the same portrait on top, then fades back to B&W as the fluid dissipates.
 * Sits fixed behind content; pointer/touch is read on the window (the canvas
 * is pointer-events:none so it never eats clicks).
 *
 * Owns the sim lifecycle imperatively: created on mount, destroyed on unmount
 * (React StrictMode double-mount and HMR both dispose the GL context cleanly).
 */
export default function FluidCanvas({
  tier,
  bwUrl,
  colorUrl,
  bgUrl,
  onReady,
}: {
  tier: Tier;
  bwUrl?: string;
  colorUrl?: string;
  bgUrl?: string;
  onReady?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onReadyRef = useRef(onReady);
  // keep the latest callback without re-running the (expensive) sim effect
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Tier the cost: high gets the full grid, mid runs lean.
    const tuning: Partial<FluidConfig> =
      tier === "high"
        ? { simResolution: 128, dyeResolution: 1024, pressureIterations: 20, curl: 28 }
        : { simResolution: 96, dyeResolution: 512, pressureIterations: 14, curl: 22 };

    const sim: FluidHandle | null = createFluidSimulation(canvas, {
      ...tuning,
      bwUrl,
      colorUrl,
      bgUrl,
      // The B&W portrait is the always-visible base; the colour version is
      // revealed where the fluid passes. Tuned to match the galekto reference:
      // portrait CENTERED (offsetX 0, name anchors center-bottom), low density
      // decay + a broad splat so colour washes across much of the screen in big
      // persistent swirls rather than a thin cursor trail.
      base: [0.984, 0.984, 0.984],
      densityDissipation: 0.9,
      velocityDissipation: 0.35,
      offsetX: 0,
      // Portraits are pre-framed in the asset itself, so show them as-is
      // (contain-fit, full image) — no magnify/crop. zoom 1.0 makes the
      // face-anchor crop a no-op.
      zoom: 1.0,
      splatRadius: 0.38,
      splatForce: 6800,
      edgeLow: 0.0,
      edgeHigh: 0.12,
      // Background sits dim behind the portrait at rest and brightens to full
      // where the fluid swirls — same density mask, just a non-zero rest floor.
      bgRest: 0.12,
    });

    if (!sim) {
      // GL unavailable — signal ready so the loader never traps the visitor.
      onReadyRef.current?.();
      return;
    }

    onReadyRef.current?.();

    // ---- pointer → splat -------------------------------------------------
    // Track last position to derive velocity; coords normalized with the
    // origin at the BOTTOM-left (WebGL convention).
    let lastX = 0;
    let lastY = 0;
    let primed = false;

    function toNorm(clientX: number, clientY: number) {
      return {
        x: clientX / window.innerWidth,
        y: 1 - clientY / window.innerHeight,
      };
    }

    function onMove(clientX: number, clientY: number) {
      // Guard against a zero (or absent) viewport — on a hidden/minimized tab
      // window.innerWidth/Height can be 0, and dividing by it would feed
      // Infinity/NaN into the GL uniforms and corrupt the sim state.
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (vw <= 0 || vh <= 0) return;

      // parallax target uses DOM-space (y-down) normalized coords
      sim!.setParallaxTarget(clientX / vw, clientY / vh);

      const { x, y } = toNorm(clientX, clientY);
      if (!primed) {
        lastX = x;
        lastY = y;
        primed = true;
        return;
      }
      const dx = (x - lastX) * 1.0;
      const dy = (y - lastY) * 1.0;
      lastX = x;
      lastY = y;
      if (dx === 0 && dy === 0) return;
      sim!.splat(x, y, dx, dy);
    }

    const onMouse = (e: MouseEvent) => onMove(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) onMove(t.clientX, t.clientY);
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    // (Idle orbital streamers are generated inside the sim's own frame loop —
    // see config.idleSplats — so they honour the visibility pause instead of
    // queuing a burst on a separate timer while the tab is hidden.)

    // ---- resize ----------------------------------------------------------
    let resizeRaf = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => sim!.resize());
    };
    window.addEventListener("resize", onResize);

    // ---- pause when hidden ----------------------------------------------
    const onVisibility = () => sim!.setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(resizeRaf);
      sim.destroy();
    };
  }, [tier, bwUrl, colorUrl, bgUrl]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-0 h-full w-full"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
