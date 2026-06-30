"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { profile } from "@/lib/content";
import { useTuner } from "@/lib/tuner-context";
import SlotName from "@/components/fx/SlotName";

/**
 * Hero — galekto-style stage, now a heavier, screen-lit CRT. The portrait +
 * colour fluid is the fixed backdrop (FluidCanvas, behind everything). Over it:
 *  - a hero-local darkening + power-flicker layer so it reads as a powered tube
 *    (scoped to the hero; the rest of the site stays bright),
 *  - heavier scanlines,
 *  - a broadcast eyebrow (light, top-left),
 *  - ONE giant "NOW TUNED · CH 0X" readout (right) that mirrors the channel
 *    tuner's lit channel — the same `focusedChannel` the rail (Nav) shows, so
 *    the two are demonstrably one system. Clicking it tunes (scrolls) there.
 *  - the giant slot-machine name anchored to the bottom, swapping PRANAV↔PATIDAR
 *    with the cursor side.
 *
 * Cursor side drives ONLY the name now (the channel comes from the tuner).
 * Disabled on touch / reduced-motion (name stays resolved, readout still works).
 */
export default function Hero() {
  const { channels, focusedChannel, tuneTo, heroDark } = useTuner();
  const [side, setSide] = useState<"a" | "b">("a");
  const [swap, setSwap] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;
    setSwap(true);
    const onMove = (e: MouseEvent) => {
      setSide(e.clientX < window.innerWidth / 2 ? "a" : "b");
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const ch = channels[focusedChannel];
  const num = String(focusedChannel + 1).padStart(2, "0");
  const accent = `var(${ch.accent})`;

  return (
    <section
      id="arrival"
      className="relative flex min-h-[99vh] flex-col overflow-hidden"
    >
      {/* Hero-local screen-lit darkening + faint power flicker. The screen
          "powers on" dark, then warms to the bright editorial stage after ~1s
          (heroDark → false fades these layers out). Scoped here (z-0, behind the
          hero content) so the rest of the site is unaffected. */}
      <div
        aria-hidden
        className="crt-flicker pointer-events-none absolute inset-0 z-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          opacity: heroDark ? 1 : 0,
          background:
            "radial-gradient(135% 105% at 50% 58%, rgba(10,9,8,0.30) 0%, rgba(9,8,7,0.62) 46%, rgba(6,5,4,0.86) 78%, rgba(4,3,3,0.92) 100%)",
        }}
      />
      {/* Heavier scanlines during power-on, fading with the darkening */}
      <div
        aria-hidden
        className="crt-scanlines-heavy pointer-events-none absolute inset-0 z-[15] transition-opacity duration-700"
        style={{ opacity: heroDark ? undefined : 0 }}
      />

      {/* eyebrow — broadcast status, top-left under the nav wordmark. Light while
          the screen is dark, then settles to the standard faint ink as it warms. */}
      <p
        className="eyebrow absolute left-[9vw] top-[calc(8vh+2.25rem)] z-50 flex items-center gap-2 transition-colors duration-700"
        style={{ color: heroDark ? "var(--color-screen-ink)" : undefined }}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-signal-bright" />
        {profile.role} · {profile.location} · ON AIR
      </p>

      {/* giant NOW TUNED readout — mirrors the tuner's lit channel. Anchored
          LEFT (where the original ghosted numeral sat) so it never collides
          with the tuner rail on the right; the two stay in lockstep via shared
          `focusedChannel`. A click affordance (tunes to the shown channel) but
          kept out of the tab order / a11y tree — keyboard & AT users navigate
          via the real tuner. */}
      <button
        aria-hidden
        tabIndex={-1}
        onClick={() => tuneTo(focusedChannel)}
        data-cursor="grow"
        className="pointer-events-auto absolute left-[7vw] top-1/2 z-40 flex -translate-y-1/2 flex-col items-start gap-1"
      >
        <span
          className="eyebrow transition-colors duration-700"
          style={{
            color: heroDark ? "var(--color-screen-ink)" : "var(--color-ink-faint)",
            opacity: 0.7,
          }}
        >
          NOW TUNED · CH {num}
        </span>
        <span
          className="phosphor-text font-condensed leading-none transition-colors duration-300"
          style={
            {
              fontSize: "var(--text-index)",
              color: accent,
              "--glow": accent,
            } as CSSProperties
          }
        >
          {num}
        </span>
        <span
          className="label text-xs transition-colors duration-300"
          style={{ color: accent }}
        >
          {ch.label}
        </span>
      </button>

      {/* giant name, anchored to the bottom and clipped by the section edge */}
      <h1
        aria-label={profile.name}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 text-center sm:px-8 md:px-16"
        style={{ fontSize: "var(--text-name)", lineHeight: 0.82 }}
      >
        <SlotName
          wordA="PRANAV"
          wordB="PATIDAR"
          side={swap ? side : undefined}
          className={`${
            heroDark ? "hero-name" : "text-ink"
          } font-condensed block translate-y-[5%] transition-colors duration-700`}
        />
      </h1>
    </section>
  );
}
