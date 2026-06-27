"use client";

import { motion, type Variants } from "motion/react";
import { skills } from "@/lib/content";
import ChannelSlate from "@/components/sections/ChannelSlate";

/* ============================================================
   CAPABILITIES — the tuner deck.
   Skills is CH 04 on the site's channel tuner, so the section is
   built as a broadcast RECEIVER: a vertical stack of horizontal
   "band" units, each with its own phosphor accent, a rotary tuning
   dial + frequency readout + live signal bars on the left rail, and
   its stations (capabilities) gridded on the right. The plain row
   numerals are gone — every station carries a mini rotary dial whose
   pointer steps down the band and lights to the accent on hover.

   Same CRT system as the rest of the site: faint scanline + ring-inset
   bezel (verbatim from About/Work), a single crt-roll flourish, and the
   house opacity+y motion on one staggerChildren owner. Dials are static
   SVG rotations (no animation) so the whole thing is reduced-motion safe.
   ============================================================ */

const EASE = [0.16, 1, 0.3, 1] as const;

// Faint CRT scanline — identical values to About/Work so this reads as the
// same broadcast system. Static gradient => reduced-motion safe.
const SCANLINE =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)";

// Needle sweep across the dial face, in degrees. Bands fan out across this
// arc by index; rows step across it by their position on the band.
const SWEEP_MIN = -120;
const SWEEP_MAX = 120;
const sweep = (i: number, n: number) =>
  n <= 1 ? 0 : SWEEP_MIN + (i / (n - 1)) * (SWEEP_MAX - SWEEP_MIN);

// One IntersectionObserver per band (on the article); the group offset lives
// ONLY here. staggerChildren propagates to the rows through the plain <ul>
// (Motion traverses non-motion DOM to the nearest motion descendants).
const moduleVariants = (gi: number): Variants => ({
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: EASE,
      delay: gi * 0.08,
      delayChildren: gi * 0.08 + 0.15,
      staggerChildren: 0.03,
    },
  },
});

// Rows carry variants only — no own whileInView, no per-row delay.
const rowVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

/* The hero rotary tuning knob on each band's rail. Pure SVG, static
   rotation, accent-stroked, decorative. */
function TunerDial({ accent, angle }: { accent: string; angle: number }) {
  const ticks = Array.from({ length: 11 });
  return (
    <svg
      viewBox="0 0 80 80"
      className="h-16 w-16 shrink-0"
      aria-hidden
      style={{ color: `var(${accent})` }}
    >
      {/* graduation ticks around the rim */}
      {ticks.map((_, i) => {
        const a = sweep(i, ticks.length);
        const lit = i === Math.round(((angle - SWEEP_MIN) / (SWEEP_MAX - SWEEP_MIN)) * (ticks.length - 1));
        return (
          <line
            key={i}
            x1="40"
            y1="7"
            x2="40"
            y2="12"
            transform={`rotate(${a} 40 40)`}
            stroke={lit ? "currentColor" : "var(--color-line)"}
            strokeWidth={lit ? 2 : 1.25}
            strokeLinecap="round"
          />
        );
      })}
      {/* knob bezel */}
      <circle cx="40" cy="40" r="21" fill="var(--color-bg-raised)" stroke="var(--color-line)" strokeWidth="1.25" />
      <circle cx="40" cy="40" r="21" fill="none" stroke="currentColor" strokeWidth="1.25" strokeOpacity="0.35" />
      {/* needle */}
      <line
        x1="40"
        y1="40"
        x2="40"
        y2="22"
        transform={`rotate(${angle} 40 40)`}
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* hub */}
      <circle cx="40" cy="40" r="3.5" fill="currentColor" />
    </svg>
  );
}

/* The per-station mini dial that replaces the old row numeral. Base pointer
   is faint; the accent pointer fades in over it on row hover (opacity only,
   so reduced-motion safe). */
function RowDial({ accent, angle }: { accent: string; angle: number }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="var(--color-line)" strokeWidth="1.25" />
      {/* base pointer */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="4.5"
        transform={`rotate(${angle} 12 12)`}
        stroke="var(--color-ink-faint)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* accent pointer — revealed on group hover */}
      <line
        x1="12"
        y1="12"
        x2="12"
        y2="4.5"
        transform={`rotate(${angle} 12 12)`}
        style={{ stroke: `var(${accent})` }}
        strokeWidth="1.5"
        strokeLinecap="round"
        className="opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <circle cx="12" cy="12" r="1.5" fill="var(--color-ink-faint)" />
    </svg>
  );
}

export default function Skills() {
  const total = skills.reduce((n, m) => n + m.items.length, 0);

  return (
    <section id="skills" className="relative px-6 py-32 sm:px-8 md:px-16 md:py-40">
      <ChannelSlate
        channel={3}
        title="Capabilities"
        status="Signal bank"
        meta={`${String(total).padStart(2, "0")} stations`}
      />

      {/* relative wrapper carries the single ambient flourish over the deck */}
      <div className="relative">
        {/* the one themed flourish: a slow refresh band drifting down the deck.
            pointer-events-none; .crt-roll self-hides under prefers-reduced-motion. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
        >
          <div className="crt-roll absolute inset-x-0 -top-1/4 h-1/4 bg-gradient-to-b from-transparent via-ink/[0.04] to-transparent" />
        </div>

        <div className="flex flex-col gap-5">
          {skills.map((mod, gi) => {
            const angle = sweep(gi, skills.length);
            return (
              <motion.article
                key={mod.unit}
                data-reveal
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-12%" }}
                variants={moduleVariants(gi)}
                className="relative overflow-hidden rounded-sm bg-bg-raised shadow-soft md:flex"
              >
                {/* shared CRT surface texture */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[1] opacity-60"
                  style={{ backgroundImage: SCANLINE }}
                />

                {/* ---- left rail: the tuner controls for this band ---- */}
                <div className="relative z-[2] flex shrink-0 items-center gap-4 border-b border-line px-5 py-5 md:w-60 md:flex-col md:items-start md:gap-3 md:border-b-0 md:border-r md:py-6">
                  <TunerDial accent={mod.accent} angle={angle} />

                  <div className="min-w-0 flex-1 md:flex-none">
                    {/* unit no. + accent LED */}
                    <div className="flex items-center gap-2">
                      <span className="font-terminal text-lg leading-none text-ink-faint">
                        U{mod.unit}
                      </span>
                      <span
                        aria-hidden
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{
                          background: `var(${mod.accent})`,
                          boxShadow: `0 0 6px var(${mod.accent})`,
                        }}
                      />
                    </div>
                    {/* band name */}
                    <h3 className="mt-1 font-condensed text-2xl leading-[0.86] text-ink md:text-[1.7rem]">
                      {mod.label}
                    </h3>
                    {/* frequency readout */}
                    <p className="mt-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-ink-faint">
                      {mod.code} · {mod.freq} MHz
                    </p>
                    {/* signal-strength bars, lit in the band accent */}
                    <span
                      aria-hidden
                      className="mt-2 flex items-end gap-[3px]"
                      style={{ height: 12 }}
                    >
                      {[5, 8, 11].map((h, i) => (
                        <span
                          key={i}
                          className={`sig-bar${i === 2 ? " peak" : ""}`}
                          style={{
                            height: h,
                            background: `var(${mod.accent})`,
                            opacity: 1,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                </div>

                {/* ---- stations: the capabilities on this band ---- */}
                <ul className="relative z-[2] flex-1 grid grid-cols-1 content-start sm:grid-cols-2 lg:grid-cols-3">
                  {mod.items.map((item, i) => (
                    <motion.li
                      key={item.name}
                      data-reveal
                      variants={rowVariants}
                      className="group flex items-center gap-3 border-b border-line-soft px-5 py-2.5 transition-colors last:border-b-0 hover:bg-bg-sunk active:bg-bg-sunk"
                    >
                      <RowDial accent={mod.accent} angle={sweep(i, mod.items.length)} />
                      <span className="flex-1 text-sm text-ink-soft transition-colors group-hover:text-ink">
                        {item.name}
                      </span>
                      {"note" in item && item.note && (
                        <span className="shrink-0 font-mono text-[0.6rem] uppercase tracking-wider text-ink-faint">
                          {item.note}
                        </span>
                      )}
                    </motion.li>
                  ))}
                </ul>

                <div className="pointer-events-none absolute inset-0 z-[3] rounded-sm ring-1 ring-inset ring-line" />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
