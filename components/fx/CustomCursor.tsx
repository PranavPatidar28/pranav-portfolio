"use client";

import { useEffect, useRef } from "react";

/**
 * Custom pointer: a small crosshair dot pinned exactly to the cursor, and a
 * larger ring that lerp-trails behind it for an elastic follow. Both use
 * mix-blend-difference so they invert against whatever is underneath (bright
 * stage or dark boot screen). The ring grows over interactive elements.
 *
 * Gated to fine-pointer, non-reduced-motion devices. When active it adds
 * `.cursor-custom` to <html>, which hides the native cursor (see globals.css);
 * touch / reduced-motion users keep their OS cursor and see nothing here.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    const root = document.documentElement;
    root.classList.add("cursor-custom");

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    // start centred so there's no jump-from-origin on first paint
    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    let rx = px;
    let ry = py;
    let visible = false;
    let ringScale = "1"; // cached; updated on mouseover, read in the rAF loop

    const RING_EASE = 0.16;

    function onMove(e: MouseEvent) {
      px = e.clientX;
      py = e.clientY;
      if (!visible) {
        visible = true;
        dot!.style.opacity = "1";
        ring!.style.opacity = "1";
      }
      // dot is pinned exactly
      dot!.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
    }

    function onLeave() {
      visible = false;
      dot!.style.opacity = "0";
      ring!.style.opacity = "0";
    }

    // grow the ring over interactive targets
    function onOver(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      const interactive = t?.closest("a, button, [role='button'], input, textarea, [data-cursor='grow']");
      ringScale = interactive ? "1.8" : "1";
      ring!.style.borderColor = interactive
        ? "rgba(189,91,60,0.9)"
        : "rgba(255,255,255,0.9)";
    }

    let raf = 0;
    function loop() {
      // Skip the interpolation + DOM write while the cursor is hidden (off the
      // window): no point animating an invisible ring. Keep the rAF scheduled
      // so it resumes instantly on the next move.
      if (visible) {
        rx += (px - rx) * RING_EASE;
        ry += (py - ry) * RING_EASE;
        ring!.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%) scale(${ringScale})`;
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeave);
      root.classList.remove("cursor-custom");
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] mix-blend-difference">
      {/* crosshair dot — two thin bars forming a plus */}
      <div
        ref={dotRef}
        className="absolute left-0 top-0 opacity-0 transition-opacity duration-300"
      >
        <span className="absolute left-1/2 top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-white" />
        <span className="absolute left-1/2 top-1/2 h-0.5 w-3 -translate-x-1/2 -translate-y-1/2 bg-white" />
      </div>

      {/* trailing ring */}
      <div
        ref={ringRef}
        className="absolute left-0 top-0 h-9 w-9 rounded-full border-[1.5px] opacity-0 transition-[opacity,border-color] duration-300"
        style={{ borderColor: "rgba(255,255,255,0.9)" }}
      />
    </div>
  );
}
