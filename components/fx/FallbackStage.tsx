"use client";

/**
 * Static backdrop shown when the WebGL fluid is gated off (weak GPU, mobile,
 * reduced motion, or no WebGL). A calm CSS gradient field on the resting
 * stage colour — no animation, no canvas. The persistent SVG grain + CRT
 * frame still layer on top, so it still reads as "inside the screen".
 */
export default function FallbackStage() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-0">
      {/* base stage colour */}
      <div className="absolute inset-0 bg-bg" />
      {/* soft clay glow drifting off-centre, evoking the fluid's resting pool */}
      <div
        className="absolute inset-0 opacity-[0.10]"
        style={{
          background:
            "radial-gradient(60% 50% at 38% 42%, var(--color-clay) 0%, transparent 60%), radial-gradient(50% 40% at 70% 65%, var(--color-signal) 0%, transparent 55%)",
        }}
      />
    </div>
  );
}
