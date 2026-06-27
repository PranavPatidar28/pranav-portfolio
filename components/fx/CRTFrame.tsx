"use client";

import { useEffect, useRef } from "react";

/**
 * Persistent CRT chrome layered over the whole page. Everything here is
 * decorative and pointer-transparent: scanlines, vignette, inner glow, a
 * rounded glass bevel, and an animated film-grain canvas redrawn at ~12fps
 * (cheap, and it keeps the "live signal" feel without burning the GPU).
 *
 * Under prefers-reduced-motion the grain canvas is skipped entirely and only
 * the static CSS layers remain, so the screen still reads as a CRT without
 * any motion.
 */
export default function CRTFrame() {
  const grainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Grain is rendered at a modest fixed resolution and stretched by CSS —
    // full-res noise every frame is needlessly expensive and looks the same.
    const GW = 256;
    const GH = 256;
    canvas.width = GW;
    canvas.height = GH;

    let raf = 0;
    let last = 0;
    const FRAME_MS = 1000 / 12;
    let running = true;

    const image = ctx.createImageData(GW, GH);
    const buf = new Uint32Array(image.data.buffer);

    function drawGrain() {
      // monochrome noise with low alpha; ABGR packing (little-endian)
      for (let i = 0; i < buf.length; i++) {
        const v = (Math.random() * 255) | 0;
        // alpha kept low so grain is a whisper over the bright stage
        buf[i] = (28 << 24) | (v << 16) | (v << 8) | v;
      }
      ctx!.putImageData(image, 0, 0);
    }

    function loop(now: number) {
      if (!running) return;
      if (now - last >= FRAME_MS) {
        last = now;
        drawGrain();
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    const onVisibility = () => {
      running = !document.hidden;
      // Cancel any already-queued frame before (re)scheduling, so a
      // hidden→visible flip never leaves two loops running in parallel.
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <>
      {/* Bezel layer — the opaque black picture tube. Sits ABOVE everything
          (content, chrome, screen FX, cursor, even the boot screen) so the
          curved tube always frames the picture, like real CRT housing. Because
          it's on top, the screen-pinned chrome (Nav wordmark, Hero edge labels,
          zone rail) is inset to live INSIDE the bowed screen window — clear of
          the tube walls — so being on top never hides it. Only the a11y skip
          link (z-110) outranks it. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[105]">
        {/* bold black CRT bezel — a real barrel-shaped tube, NOT a rounded
            rect. Each edge bows outward and the corners are big sweeping curves
            (quadratic beziers), so the whole site reads as footage on a curved
            picture tube. The SVG fills the viewport black with an evenodd
            cut-out of the bowed screen window; preserveAspectRatio="none"
            stretches the 0..100 path to fill any viewport. A second stroked
            path traces the glass rim so the highlight follows the same bow.
            (Corner-pinned UI no longer needs a gentle inset to clear the tube —
            the layer split below the chrome handles that.) */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 H100 V100 H0 Z M14,2.6 Q50,-0.4 86,2.6 Q97.4,2.6 97.4,14 Q100.4,50 97.4,86 Q97.4,97.4 86,97.4 Q50,100.4 14,97.4 Q2.6,97.4 2.6,86 Q-0.4,50 2.6,14 Q2.6,2.6 14,2.6 Z"
            fill="#08070a"
            fillRule="evenodd"
          />
          <path
            d="M14,2.6 Q50,-0.4 86,2.6 Q97.4,2.6 97.4,14 Q100.4,50 97.4,86 Q97.4,97.4 86,97.4 Q50,100.4 14,97.4 Q2.6,97.4 2.6,86 Q-0.4,50 2.6,14 Q2.6,2.6 14,2.6 Z"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {/* Screen FX layer — scanlines, grille, grain, roll, glow, vignette. All
          low-opacity / blended and pointer-transparent, so they wash over the
          whole screen INCLUDING the chrome (authentic 'behind the glass')
          without hiding or blocking anything. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[55]">
      {/* film grain (animated; absent under reduced motion) */}
      <canvas
        ref={grainRef}
        className="absolute inset-0 h-full w-full opacity-[0.05] mix-blend-multiply"
      />

      {/* static fine-grain darkening — a small high-frequency noise tile in
          multiply blend. Adds a subtle grainy texture AND a touch of overall
          darkness in one pass, independent of the animated grain. Kept low so
          it never muddies the content. */}
      <div
        className="absolute inset-0 mix-blend-multiply opacity-[0.10]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
          backgroundSize: "90px 90px",
        }}
      />

      {/* overall darkening tint — a flat low-opacity wash that gently dims the
          whole screen for a slightly moodier, screen-lit feel. Normal blend so
          it darkens uniformly without altering hue. */}
      <div className="absolute inset-0 bg-[#0a0908] opacity-[0.08]" />

      {/* scanlines — horizontal raster lines */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.07) 0px, rgba(0,0,0,0.07) 1px, transparent 1.5px, transparent 3px)",
        }}
      />

      {/* aperture grille — vertical RGB subpixel stripes, the signature CRT
          shadow-mask shimmer. Multiply blend so it tints the bright stage
          rather than washing out; kept low-opacity so text stays crisp. */}
      <div
        className="absolute inset-0 opacity-[0.5] mix-blend-multiply"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(255,0,0,0.06) 0px, rgba(255,0,0,0.06) 1px, rgba(0,255,0,0.06) 1px, rgba(0,255,0,0.06) 2px, rgba(0,0,255,0.06) 2px, rgba(0,0,255,0.06) 3px)",
        }}
      />

      {/* rolling refresh band — a soft bright bar drifting down the screen, the
          "out-of-sync vertical hold" roll. CSS-animated; globals.css strips it
          under prefers-reduced-motion. */}
      <div
        className="crt-roll absolute inset-x-0 h-[28%]"
        style={{
          background:
            "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.06) 55%, transparent)",
        }}
      />

      {/* inner glow — soft phosphor bloom at the edges */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow:
            "inset 0 0 120px 20px rgba(255,255,255,0.10), inset 0 0 40px rgba(0,0,0,0.05)",
        }}
      />

      {/* vignette — radial darkening to the corners (curved-glass falloff) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 50%, transparent 52%, rgba(20,16,14,0.34) 100%)",
        }}
      />
      </div>
    </>
  );
}
