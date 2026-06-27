"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { profile, projects } from "@/lib/content";
import { Reveal } from "@/components/Reveal";
import ChannelSlate from "@/components/sections/ChannelSlate";

/* Shared CRT raster — same value Work/Skills/Contact use, so every
   broadcast surface rasters identically. */
const SCANLINE =
  "repeating-linear-gradient(0deg, rgba(0,0,0,0.14) 0px, rgba(0,0,0,0.14) 1px, transparent 1px, transparent 3px)";

export default function About() {
  return (
    <section
      id="about"
      className="relative px-6 py-32 sm:px-8 md:py-40 md:pl-16 md:pr-32 lg:pr-44"
    >
      <div className="grid gap-12 md:grid-cols-12 md:gap-16">
        {/* portrait — framed as a live studio camera monitor: B&W photo base,
            painterly illustration crossfading in on hover, under CRT scanlines +
            vignette with viewfinder brackets, a REC/CAM chrome row, and a
            broadcast lower-third chyron carrying the name. */}
        <div className="md:col-span-5">
          <Reveal>
            <figure
              className="group relative aspect-[4/5] w-full max-w-sm overflow-hidden rounded-sm bg-bg-sunk shadow-soft"
              data-cursor="grow"
            >
              {/* base: black & white photograph */}
              <Image
                src="/portrait.webp"
                alt={`${profile.name}, ${profile.role}`}
                fill
                sizes="(max-width: 768px) 80vw, 400px"
                className="object-cover"
                priority={false}
              />
              {/* reveal: stylized illustration, fades in on hover/focus */}
              <Image
                src="/portrait-art.webp"
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 768px) 80vw, 400px"
                className="object-cover opacity-0 transition-opacity duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100"
              />

              {/* CRT screen treatment — scanlines + vignette, matching the
                  project monitors so this reads as the same broadcast system. */}
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
                    "radial-gradient(120% 100% at 50% 45%, transparent 58%, rgba(20,16,14,0.4) 100%)",
                }}
              />

              {/* camera viewfinder corner brackets */}
              <span className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 border-l border-t border-bg-raised/70 mix-blend-difference" />
              <span className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 border-r border-t border-bg-raised/70 mix-blend-difference" />
              <span className="pointer-events-none absolute bottom-2.5 left-2.5 h-4 w-4 border-b border-l border-bg-raised/70 mix-blend-difference" />
              <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-4 w-4 border-b border-r border-bg-raised/70 mix-blend-difference" />

              {/* top chrome row — REC indicator + camera label (CH 03 → CAM 03) */}
              <div className="pointer-events-none absolute inset-x-5 top-4 flex items-center justify-between font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bg-raised mix-blend-difference">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-signal-bright shadow-[0_0_6px_var(--color-signal-bright)]" />
                  REC
                </span>
                <span>CAM 03</span>
              </div>

              {/* lower-third chyron — the broadcast name strip */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-boot/90 via-boot/40 to-transparent"
              />
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 flex items-stretch gap-3 p-4">
                <span className="w-1 shrink-0 bg-amber" />
                <span>
                  <span className="block font-condensed text-2xl uppercase leading-none text-bg-raised">
                    {profile.name}
                  </span>
                  <span className="mt-1.5 block font-mono text-[0.62rem] uppercase tracking-[0.18em] text-bg-raised/70">
                    {profile.role} · {profile.location}
                  </span>
                </span>
              </figcaption>

              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-line" />
            </figure>
          </Reveal>
        </div>

        {/* operator profile — CH 03, the same channel the tuner lights here */}
        <div className="md:col-span-7">
          <ChannelSlate
            channel={2}
            title="The operator"
            status="Off air"
            titleSize="clamp(2.75rem, 6vw, 5rem)"
            className="mb-10"
          />

          {/* bio framed as the on-air feed — broadcast card mirroring Contact's
              transmission panel, with an amber CH 03 signal margin. Type stays
              generous so it reads effortlessly. */}
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-sm bg-bg-raised p-7 shadow-soft sm:p-9">
              {/* shared CRT surface + hairline bezel */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-50"
                style={{ backgroundImage: SCANLINE }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-sm ring-1 ring-inset ring-line"
              />
              {/* amber channel signal margin */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-amber"
              />

              {/* terminal status header */}
              <div className="relative mb-6 flex items-center justify-between border-b border-line-soft pb-3 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-ink-faint">
                <span>Operator profile</span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_6px_var(--color-amber)]" />
                  On air
                </span>
              </div>

              {/* bio — generous, legible */}
              <div className="relative space-y-6">
                {profile.bio.map((para, i) => (
                  <Reveal key={i} delay={0.15 + i * 0.1}>
                    <p className="text-lg leading-relaxed text-ink-soft">{para}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* signal readout — broadcast equipment meters */}
          <Reveal delay={0.4}>
            <div className="mt-10 border-t border-line pt-6">
              <p className="eyebrow mb-5 flex items-center gap-2">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber shadow-[0_0_6px_var(--color-amber)]" />
                Signal readout
              </p>
              <div className="grid grid-cols-3 gap-x-6 gap-y-4">
                <Stat
                  value={String(projects.length).padStart(2, "0")}
                  label="Shipped projects"
                />
                <Stat
                  value={String(
                    projects.filter((p) => p.links.live).length,
                  ).padStart(2, "0")}
                  label="Live deployments"
                  live
                />
                <Stat value="100%" label="TypeScript" />
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  live = false,
}: {
  value: string;
  label: string;
  live?: boolean;
}) {
  return (
    <div>
      {/* signal-strength meter — lit amber bars (Skills' mechanism) */}
      <span aria-hidden className="mb-2 flex h-3.5 items-end gap-[3px]">
        {[6, 10, 14].map((h, i) => (
          <span
            key={i}
            className={`sig-bar lit${live && i === 2 ? " peak" : ""}`}
            style={{ height: h, background: "var(--color-amber)", opacity: 1 }}
          />
        ))}
      </span>
      {/* value — ink glyph (full contrast) with a faint amber phosphor halo */}
      <div
        className="phosphor-text font-condensed text-4xl text-ink"
        style={{ "--glow": "var(--color-amber)" } as CSSProperties}
      >
        {value}
      </div>
      <div className="mt-1 flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-ink-faint">
        {live && (
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-amber shadow-[0_0_6px_var(--color-amber)] motion-reduce:animate-none" />
        )}
        {label}
      </div>
    </div>
  );
}
