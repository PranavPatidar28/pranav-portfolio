"use client";

import { useTuner } from "@/lib/tuner-context";

/**
 * Channel-change glitch — a short RGB-split + static-snow burst fired when the
 * visitor tunes to a section. Purely decorative and pointer-transparent.
 *
 * Mechanism: `glitchKey` increments on every tune. Keying the wrapper on it
 * remounts the element, which restarts the CSS animations. Every layer animates
 * to opacity 0, so the burst self-clears with NO JS timer / setState. Returns
 * null until the first tune so SSR/first paint is stable. Under reduced-motion
 * the whole overlay is `display:none` (globals.css) → the tune is an instant cut.
 *
 * z-[102]: above the custom cursor (z-90) and the CRT screen FX (z-55), below
 * the bezel (z-105) and the skip link (z-110).
 */
export default function ChannelGlitch() {
  const { glitchKey } = useTuner();
  if (glitchKey === 0) return null;
  return (
    <div
      key={glitchKey}
      aria-hidden
      className="channel-glitch pointer-events-none fixed inset-0 z-[102] overflow-hidden"
    >
      <div className="layer dropout" />
      <div className="layer snow" />
      <div className="layer rgb rgb-r" />
      <div className="layer rgb rgb-b" />
      <div className="layer tear" />
    </div>
  );
}
