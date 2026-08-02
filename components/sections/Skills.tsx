"use client";

import { motion, type Variants } from "motion/react";
import type { CSSProperties } from "react";
import { skills } from "@/lib/content";
import ChannelSlate from "@/components/sections/ChannelSlate";

/* ============================================================
   CAPABILITIES — the master receiver.

   The section uses the same broadcast system as the hero and Work: a dark
   instrument surface for live signal, surrounded by clean editorial reading
   space. A master receiver summarizes the full spectrum, then each capability
   band gets a proper hardware header and a compact station directory.
   ============================================================ */

const EASE = [0.16, 1, 0.3, 1] as const;
const SWEEP_MIN = -120;
const SWEEP_MAX = 120;
const sweep = (i: number, n: number) =>
  n <= 1 ? 0 : SWEEP_MIN + (i / (n - 1)) * (SWEEP_MAX - SWEEP_MIN);

const moduleVariants = (index: number): Variants => ({
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.72,
      ease: EASE,
      delay: index * 0.06,
      delayChildren: index * 0.06 + 0.12,
      staggerChildren: 0.025,
    },
  },
});

const stationVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

function TunerDial({ angle }: { angle: number }) {
  const ticks = Array.from({ length: 13 });
  const litTick = Math.round(
    ((angle - SWEEP_MIN) / (SWEEP_MAX - SWEEP_MIN)) * (ticks.length - 1)
  );

  return (
    <svg viewBox="0 0 96 96" className="h-20 w-20 shrink-0" aria-hidden>
      {ticks.map((_, index) => {
        const tickAngle = sweep(index, ticks.length);
        const lit = index === litTick;
        return (
          <line
            key={index}
            x1="48"
            y1="5"
            x2="48"
            y2={lit ? "13" : "10"}
            transform={`rotate(${tickAngle} 48 48)`}
            stroke={lit ? "var(--band-accent)" : "rgba(236,235,228,0.25)"}
            strokeWidth={lit ? 2 : 1}
            strokeLinecap="round"
          />
        );
      })}
      <circle
        cx="48"
        cy="48"
        r="27"
        fill="#100e0d"
        stroke="rgba(236,235,228,0.2)"
        strokeWidth="1.25"
      />
      <circle
        cx="48"
        cy="48"
        r="23"
        fill="none"
        stroke="var(--band-accent)"
        strokeOpacity="0.3"
      />
      <line
        x1="48"
        y1="48"
        x2="48"
        y2="25"
        transform={`rotate(${angle} 48 48)`}
        stroke="var(--band-accent)"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
      <circle cx="48" cy="48" r="4" fill="var(--band-accent)" />
      <circle cx="48" cy="48" r="1.5" fill="#100e0d" />
    </svg>
  );
}

function SignalMeter({ index }: { index: number }) {
  const bars = Array.from({ length: 16 }, (_, bar) => {
    const wave = Math.sin((bar + index * 2) * 0.82) * 0.5 + 0.5;
    return 5 + Math.round(wave * 19);
  });

  return (
    <span aria-hidden className="flex h-7 items-end gap-[3px]">
      {bars.map((height, bar) => (
        <span
          key={bar}
          className="w-[3px] rounded-t-[1px] bg-[var(--band-accent)] transition-opacity duration-300"
          style={{ height, opacity: 0.28 + (bar / bars.length) * 0.68 }}
        />
      ))}
    </span>
  );
}

function MasterReceiver({ total }: { total: number }) {
  const spectrum = Array.from({ length: 34 }, (_, index) => {
    const primary = Math.sin(index * 0.68) * 0.5 + 0.5;
    const secondary = Math.cos(index * 1.47) * 0.5 + 0.5;
    return 8 + Math.round((primary * 0.68 + secondary * 0.32) * 42);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: EASE }}
      className="capability-master relative mb-6 overflow-hidden border border-screen-ink/10 bg-boot text-screen-ink shadow-lift"
    >
      <div className="capability-raster pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[0.75fr_1.5fr_0.65fr] lg:items-end">
        <div>
          <p className="flex items-center gap-2 font-terminal text-base uppercase tracking-[0.12em] text-amber-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-signal-bright shadow-[0_0_8px_var(--color-signal-bright)]" />
            Master receiver 04
          </p>
          <p className="mt-4 font-condensed text-4xl leading-[0.84] text-screen-ink sm:text-5xl">
            Full
            <br />
            spectrum
          </p>
          <p className="mt-3 max-w-[28ch] text-sm leading-relaxed text-screen-ink/55">
            Product engineering from interface to infrastructure.
          </p>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex items-center justify-between font-mono text-[0.58rem] uppercase tracking-[0.16em] text-screen-ink/45">
            <span>Live capability spectrum</span>
            <span>Signal stable</span>
          </div>
          <div className="flex h-24 items-end justify-between gap-[3px] border-y border-screen-ink/10 py-3 sm:h-28">
            {spectrum.map((height, index) => (
              <span
                key={index}
                aria-hidden
                className="capability-spectrum-bar min-w-[2px] flex-1 bg-broadcast-blue"
                style={{
                  height,
                  opacity: 0.32 + (index / spectrum.length) * 0.62,
                }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between font-terminal text-sm text-screen-ink/40">
            <span>88.1</span>
            <span>115.3</span>
            <span>142.0 MHz</span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden border border-screen-ink/10 bg-screen-ink/10 lg:grid-cols-1">
          <div className="bg-boot/95 p-4">
            <dt className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-screen-ink/40">
              Bands online
            </dt>
            <dd className="mt-1 font-terminal text-3xl text-amber">
              {String(skills.length).padStart(2, "0")}
            </dd>
          </div>
          <div className="bg-boot/95 p-4">
            <dt className="font-mono text-[0.56rem] uppercase tracking-[0.16em] text-screen-ink/40">
              Stations locked
            </dt>
            <dd className="mt-1 font-terminal text-3xl text-signal-bright">
              {String(total).padStart(2, "0")}
            </dd>
          </div>
        </dl>
      </div>
    </motion.div>
  );
}

export default function Skills() {
  const total = skills.reduce((count, module) => count + module.items.length, 0);

  return (
    <section
      id="skills"
      className="relative px-6 py-32 sm:px-8 md:px-16 md:py-40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-20 h-[54rem] opacity-60"
        style={{
          background:
            "radial-gradient(45% 42% at 20% 35%, rgba(29,78,216,0.08), transparent 72%), radial-gradient(42% 38% at 82% 68%, rgba(34,197,94,0.055), transparent 74%)",
        }}
      />

      <ChannelSlate
        channel={3}
        title="Capabilities"
        status="Signal bank"
        meta={`${String(total).padStart(2, "0")} stations`}
      />

      <div className="relative">
        <MasterReceiver total={total} />

        <div className="mb-5 flex items-end justify-between border-b border-line pb-3">
          <div>
            <p className="eyebrow text-broadcast-blue">Frequency directory</p>
            <h3 className="mt-1 text-xl font-semibold tracking-tight text-ink sm:text-2xl">
              Six operating bands
            </h3>
          </div>
          <span className="hidden font-terminal text-base text-ink-faint sm:block">
            RX 04 · ALL CHANNELS
          </span>
        </div>

        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          {skills.map((module, moduleIndex) => {
            const angle = sweep(moduleIndex, skills.length);
            const bandStyle = {
              "--band-accent": `var(${module.accent})`,
            } as CSSProperties;

            return (
              <motion.article
                key={module.unit}
                data-reveal
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-10%" }}
                variants={moduleVariants(moduleIndex)}
                className="capability-module relative flex h-full flex-col overflow-hidden border border-line bg-bg-raised shadow-soft transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-[var(--band-accent)] hover:shadow-lift"
                style={bandStyle}
              >
                <div className="capability-band relative overflow-hidden bg-boot px-5 py-5 text-screen-ink sm:px-6 sm:py-6">
                  <div className="capability-raster pointer-events-none absolute inset-0 opacity-45" />
                  <div className="relative flex items-start justify-between gap-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 font-terminal text-base uppercase tracking-[0.12em] text-screen-ink/55">
                        <span style={{ color: "var(--band-accent)" }}>
                          U{module.unit}
                        </span>
                        <span>·</span>
                        <span>{module.freq} MHz</span>
                        <span
                          aria-hidden
                          className="ml-1 h-1.5 w-1.5 rounded-full bg-[var(--band-accent)] shadow-[0_0_8px_var(--band-accent)]"
                        />
                      </div>
                      <h3 className="mt-4 max-w-[12ch] font-condensed text-[2.15rem] leading-[0.84] text-screen-ink sm:text-[2.55rem]">
                        {module.label}
                      </h3>
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <SignalMeter index={moduleIndex} />
                        <span className="font-mono text-[0.56rem] uppercase tracking-[0.14em] text-screen-ink/40">
                          {module.code} · {String(module.items.length).padStart(2, "0")} stations
                        </span>
                      </div>
                    </div>
                    <TunerDial angle={angle} />
                  </div>
                </div>

                <ul className="relative grid flex-1 grid-cols-2 content-start">
                  {module.items.map((item, stationIndex) => (
                    <motion.li
                      key={item.name}
                      data-reveal
                      variants={stationVariants}
                      className="capability-station group flex min-h-16 items-center gap-2.5 border-b border-line-soft px-3 py-3 transition-colors odd:border-r sm:gap-3 sm:px-4"
                    >
                      <span className="font-terminal text-sm tabular-nums text-ink-faint transition-colors group-hover:text-[var(--band-accent)]">
                        {String(stationIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-ink-soft transition-colors group-hover:text-ink">
                          {item.name}
                        </span>
                        {"note" in item && item.note && (
                          <span className="mt-0.5 block truncate font-mono text-[0.56rem] uppercase tracking-[0.11em] text-ink-faint">
                            {item.note}
                          </span>
                        )}
                      </span>
                      <span
                        aria-hidden
                        className="h-1.5 w-1.5 shrink-0 rounded-full border border-[var(--band-accent)] opacity-35 transition-[opacity,background-color,box-shadow] duration-300 group-hover:bg-[var(--band-accent)] group-hover:opacity-100 group-hover:shadow-[0_0_7px_var(--band-accent)]"
                      />
                    </motion.li>
                  ))}
                </ul>

                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/[0.02]" />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
