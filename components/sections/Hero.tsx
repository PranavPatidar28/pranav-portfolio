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
        style={{
          color: heroDark ? "var(--color-screen-ink)" : "var(--color-ink)",
        }}
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
      {/* Mobile/tablet mission statement. The full operator brief below is kept
          for wide screens; this compact version preserves the same clarity
          without covering the portrait on a narrow CRT. */}
      <div className="absolute inset-x-[9vw] top-[calc(8vh+5.2rem)] z-40 xl:hidden">
        <p
          className="max-w-[21rem] text-[0.82rem] font-medium leading-snug tracking-[-0.01em] transition-colors duration-700 sm:text-base"
          style={{
            color: heroDark ? "var(--color-screen-ink)" : "var(--color-ink)",
          }}
        >
          Production-grade products, real-time systems, and AI-assisted
          experiences.
        </p>
        <button
          type="button"
          onClick={() => tuneTo(1)}
          data-cursor="grow"
          className="mt-3 inline-flex items-center gap-2 border-b pb-1 font-mono text-[0.62rem] uppercase tracking-[0.16em] transition-colors duration-300"
          style={{ color: accent, borderColor: accent }}
        >
          View selected work
          <span aria-hidden>↓</span>
        </button>
      </div>

      {/* Desktop operator brief — an OSD-style panel that gives the cinematic
          stage a clear professional message and an immediate route into the
          work. It stays opaque enough to remain crisp over the live WebGL feed. */}
      <aside className="hero-brief absolute right-[10vw] top-[22vh] z-40 hidden w-[min(31vw,22rem)] overflow-hidden border border-amber/20 bg-boot/[0.90] text-screen-ink shadow-lift xl:block">
        <div className="hero-brief-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative p-6 xl:p-7">
          <div className="flex items-center justify-between border-b border-screen-ink/15 pb-3 font-terminal text-sm uppercase tracking-[0.12em] text-amber-soft">
            <span>Operator brief</span>
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-bright shadow-[0_0_8px_var(--color-signal-bright)]" />
              Live 001
            </span>
          </div>

          <p className="mt-6 font-condensed text-[clamp(2.5rem,4vw,4.25rem)] leading-[0.82] text-screen-ink">
            Systems
            <br />
            that ship.
          </p>
          <p className="mt-5 max-w-[30ch] text-sm leading-relaxed text-screen-ink/70 xl:text-[0.95rem]">
            I build production-grade web, mobile, and desktop products—from
            resilient APIs to interfaces that feel effortless.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => tuneTo(1)}
              data-cursor="grow"
              className="group inline-flex items-center gap-2 rounded-full bg-amber px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-boot transition-colors hover:bg-amber-soft"
            >
              Explore work
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                →
              </span>
            </button>
            <a
              href={profile.socials.github}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="grow"
              className="inline-flex items-center gap-2 rounded-full border border-screen-ink/20 px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-screen-ink/75 transition-colors hover:border-screen-ink/50 hover:text-screen-ink"
            >
              GitHub
              <span aria-hidden>↗</span>
            </a>
          </div>

          <button
            type="button"
            onClick={() => tuneTo(1)}
            className="group mt-7 flex w-full items-end justify-between border-t border-screen-ink/15 pt-4 text-left"
            data-cursor="grow"
            aria-label="View SmartDeck in selected work"
          >
            <span>
              <span className="block font-mono text-[0.58rem] uppercase tracking-[0.18em] text-screen-ink/45">
                Current signal
              </span>
              <span className="mt-1 block text-sm font-semibold tracking-tight text-screen-ink transition-colors group-hover:text-amber-soft">
                SmartDeck
              </span>
            </span>
            <span className="font-terminal text-base text-signal-bright">
              CH 02 · LOCKED
            </span>
          </button>
        </div>
      </aside>

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
      {/* The giant word swaps on desktop, so explain the interaction instead of
          leaving it as an unexplained flourish. */}
      <p
        aria-hidden
        className="absolute inset-x-0 bottom-[18vh] z-30 hidden text-center font-mono text-[0.58rem] uppercase tracking-[0.24em] transition-colors duration-700 xl:block"
        style={{
          color: heroDark
            ? "var(--color-screen-ink)"
            : "var(--color-ink-faint)",
          opacity: 0.72,
        }}
      >
        Signal ID · {side === "a" ? "first name" : "surname"} · move cursor
      </p>

      <h1
        aria-label={profile.name}
        className="pointer-events-none absolute inset-x-0 bottom-[5vh] z-10 px-6 text-center sm:bottom-0 sm:px-8 md:px-16"
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
