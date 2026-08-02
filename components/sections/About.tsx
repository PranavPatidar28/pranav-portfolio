"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { profile, projects } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import ChannelSlate from "@/components/sections/ChannelSlate";

const SCANLINE =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)";

const signalPath = [
  { number: "01", label: "Source", title: "API & data", note: "holds the truth" },
  { number: "02", label: "Transport", title: "Real-time", note: "keeps it live" },
  { number: "03", label: "Output", title: "Interface", note: "feels effortless" },
] as const;

export default function About() {
  const liveProjects = projects.filter((project) => project.links.live).length;

  return (
    <section
      id="about"
      className="relative px-6 py-32 sm:px-8 md:py-40 md:pl-16 md:pr-32 lg:pr-44"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 h-[46rem] opacity-65"
        style={{
          background:
            "radial-gradient(50% 45% at 18% 46%, rgba(255,176,0,0.075), transparent 70%), radial-gradient(42% 40% at 82% 58%, rgba(189,91,60,0.055), transparent 74%)",
        }}
      />

      <div className="relative grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* A live camera feed rather than a plain profile image. The portrait
            remains photographic at rest and resolves into the illustrated
            operator identity on hover. */}
        <div className="lg:sticky lg:top-[12vh] lg:col-span-5 lg:self-start">
          <Reveal>
            <div className="operator-camera-shell mx-auto w-full max-w-sm bg-boot p-2 shadow-lift lg:mx-0">
              <figure
                className="group relative aspect-[4/5] overflow-hidden bg-bg-sunk"
                data-cursor="grow"
              >
                <Image
                  src="/portrait.webp"
                  alt={`${profile.name}, ${profile.role}`}
                  fill
                  sizes="(max-width: 1024px) 80vw, 400px"
                  className="object-cover transition-[filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:contrast-110"
                  priority={false}
                />
                <Image
                  src="/portrait-art.webp"
                  alt=""
                  aria-hidden
                  fill
                  sizes="(max-width: 1024px) 80vw, 400px"
                  className="object-cover opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
                />

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{ backgroundImage: SCANLINE }}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(115% 95% at 50% 43%, transparent 54%, rgba(12,10,9,0.48) 100%)",
                  }}
                />

                {/* viewfinder and focus target */}
                <span className="pointer-events-none absolute left-3 top-3 h-5 w-5 border-l border-t border-bg-raised/70 mix-blend-difference" />
                <span className="pointer-events-none absolute right-3 top-3 h-5 w-5 border-r border-t border-bg-raised/70 mix-blend-difference" />
                <span className="pointer-events-none absolute bottom-3 left-3 h-5 w-5 border-b border-l border-bg-raised/70 mix-blend-difference" />
                <span className="pointer-events-none absolute bottom-3 right-3 h-5 w-5 border-b border-r border-bg-raised/70 mix-blend-difference" />
                <span className="operator-reticle pointer-events-none absolute left-1/2 top-[43%] h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-bg-raised/35 opacity-0 mix-blend-difference transition-opacity duration-500 group-hover:opacity-100" />

                <div className="pointer-events-none absolute inset-x-5 top-4 flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-[0.17em] text-bg-raised mix-blend-difference">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-bright shadow-[0_0_6px_var(--color-signal-bright)]" />
                    REC · SOURCE A
                  </span>
                  <span>CAM 03</span>
                </div>

                <div className="pointer-events-none absolute inset-x-5 top-10 flex justify-between font-terminal text-sm text-bg-raised/75 mix-blend-difference">
                  <span>ISO 400</span>
                  <span>00:03:28:06</span>
                </div>

                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-boot/95 via-boot/55 to-transparent"
                />
                <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-stretch gap-3 p-5">
                  <span className="w-1 shrink-0 bg-amber shadow-[0_0_8px_var(--color-amber)]" />
                  <span>
                    <span className="block font-condensed text-[1.75rem] uppercase leading-none text-bg-raised">
                      {profile.name}
                    </span>
                    <span className="mt-1.5 block font-mono text-[0.6rem] uppercase tracking-[0.17em] text-bg-raised/65">
                      {profile.role} · {profile.location}
                    </span>
                  </span>
                </figcaption>
              </figure>

              {/* physical tape beneath the camera monitor */}
              <dl className="grid grid-cols-3 gap-px bg-screen-ink/10 text-screen-ink">
                <OperatorDatum label="Base" value={profile.location} />
                <OperatorDatum label="Mode" value="End-to-end" />
                <OperatorDatum label="Status" value="Available" live />
              </dl>
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7">
          <ChannelSlate
            channel={2}
            title="The operator"
            status="Identity feed"
            titleSize="clamp(2.75rem, 6vw, 5rem)"
            className="mb-8"
          />

          <Reveal delay={0.1}>
            <article className="operator-dossier relative overflow-hidden border border-screen-ink/10 bg-boot text-screen-ink shadow-lift">
              <div className="operator-raster pointer-events-none absolute inset-0 opacity-45" />
              <div className="relative p-6 sm:p-8 lg:p-9">
                <div className="flex items-center justify-between border-b border-screen-ink/15 pb-3 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-screen-ink/45">
                  <span>Operator dossier · ID PP-028</span>
                  <span className="flex items-center gap-1.5 text-amber-soft">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_6px_var(--color-amber)]" />
                    Signal verified
                  </span>
                </div>

                <p className="mt-7 font-condensed text-[clamp(2.75rem,5.5vw,5.25rem)] leading-[0.82] text-screen-ink">
                  I build the
                  <br />
                  whole thing.
                </p>
                <p className="mt-5 max-w-[49ch] text-base leading-relaxed text-screen-ink/65 sm:text-lg">
                  {profile.tagline}
                </p>

                {/* The operator's end-to-end engineering path, expressed as a
                    signal chain instead of another list of technologies. */}
                <div className="mt-8 grid gap-px overflow-hidden border border-screen-ink/10 bg-screen-ink/10 sm:grid-cols-3">
                  {signalPath.map((stage) => (
                    <div
                      key={stage.number}
                      className="operator-path group relative bg-boot/95 p-4 sm:p-5"
                    >
                      <div className="flex items-center justify-between font-terminal text-base">
                        <span className="text-amber">{stage.number}</span>
                        <span className="h-1.5 w-1.5 rounded-full border border-amber/60 transition-[background-color,box-shadow] duration-300 group-hover:bg-amber group-hover:shadow-[0_0_7px_var(--color-amber)]" />
                      </div>
                      <p className="mt-4 font-mono text-[0.55rem] uppercase tracking-[0.16em] text-screen-ink/35">
                        {stage.label}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-screen-ink">
                        {stage.title}
                      </p>
                      <p className="mt-0.5 font-terminal text-base text-screen-ink/45">
                        {stage.note}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 grid gap-6 border-t border-screen-ink/15 pt-7 sm:grid-cols-2">
                  {profile.bio.slice(1).map((paragraph, index) => (
                    <div key={paragraph}>
                      <p className="font-terminal text-base text-amber-soft/80">
                        LOG {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-screen-ink/58">
                        {paragraph}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Telemetry belongs to the dossier instead of sitting below as
                  a detached stats row. */}
              <div className="relative grid grid-cols-3 gap-px border-t border-screen-ink/10 bg-screen-ink/10">
                <Stat
                  value={String(projects.length).padStart(2, "0")}
                  label="Shipped projects"
                  accent="var(--color-amber)"
                />
                <Stat
                  value={String(liveProjects).padStart(2, "0")}
                  label="Live deployments"
                  accent="var(--color-signal-bright)"
                  live
                />
                <Stat
                  value="100%"
                  label="TypeScript"
                  accent="var(--color-clay-soft)"
                />
              </div>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function OperatorDatum({
  label,
  value,
  live = false,
}: {
  label: string;
  value: string;
  live?: boolean;
}) {
  return (
    <div className="bg-boot/95 px-3 py-3">
      <dt className="font-mono text-[0.5rem] uppercase tracking-[0.15em] text-screen-ink/35">
        {label}
      </dt>
      <dd className="mt-1 flex items-center gap-1.5 truncate font-terminal text-base text-screen-ink/75">
        {live && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-signal-bright shadow-[0_0_6px_var(--color-signal-bright)]" />
        )}
        {value}
      </dd>
    </div>
  );
}

function Stat({
  value,
  label,
  accent,
  live = false,
}: {
  value: string;
  label: string;
  accent: string;
  live?: boolean;
}) {
  return (
    <div
      className="bg-boot/95 p-4 sm:p-5"
      style={{ "--stat-accent": accent } as CSSProperties}
    >
      <span aria-hidden className="mb-2 flex h-3 items-end gap-[3px]">
        {[5, 8, 11].map((height, index) => (
          <span
            key={height}
            className={live && index === 2 ? "animate-pulse" : undefined}
            style={{
              width: 3,
              height,
              background: "var(--stat-accent)",
              boxShadow:
                index === 2 ? "0 0 6px var(--stat-accent)" : undefined,
            }}
          />
        ))}
      </span>
      <div className="font-terminal text-3xl text-[var(--stat-accent)] sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 font-mono text-[0.52rem] uppercase tracking-[0.12em] text-screen-ink/40 sm:text-[0.58rem]">
        {label}
      </div>
    </div>
  );
}
